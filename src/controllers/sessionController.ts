import { Request, Response } from 'express';
import { FocusSession } from '../models/FocusSession';
import { User } from '../models/User';
import { Group } from '../models/Group';

export const syncSessions = async (req: Request, res: Response) => {
  try {
    const { userId, sessions } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const sessionList = Array.isArray(sessions) ? sessions : [sessions];
    const savedSessions = [];
    let addedMinutesTotal = 0;

    for (const s of sessionList) {
      if (!s || !s.sessionId) continue;
      const targetMins = s.targetDurationMinutes || (s.actualDurationSeconds ? Math.round(s.actualDurationSeconds / 60) : (s.minutes || 25));
      const actualSecs = s.actualDurationSeconds || (s.minutes ? s.minutes * 60 : targetMins * 60);
      const startedAt = s.startedAt ? new Date(s.startedAt) : (s.completedAt ? new Date(new Date(s.completedAt).getTime() - actualSecs * 1000) : new Date());
      const completedAt = s.completedAt ? new Date(s.completedAt) : new Date();

      const doc = await FocusSession.findOneAndUpdate(
        { sessionId: s.sessionId },
        {
          $setOnInsert: {
            sessionId: s.sessionId,
            userId,
            mode: s.mode || 'focus',
            targetDurationMinutes: targetMins,
            actualDurationSeconds: actualSecs,
            startedAt,
            completedAt,
            isStrictMode: !!s.isStrictMode,
            blockedAppsCount: s.blockedAppsCount || 0,
            completed: s.completed !== false,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      savedSessions.push(doc);
      if (s.mode === 'focus' && s.completed !== false) {
        addedMinutesTotal += Math.round(actualSecs / 60);
      }
    }

    // Update User cumulative stats
    if (addedMinutesTotal > 0) {
      const user = await User.findOneAndUpdate(
        { userId },
        {
          $inc: {
            totalFocusMinutes: addedMinutesTotal,
            weeklyFocusMinutes: addedMinutesTotal,
          },
          $set: { lastActiveAt: new Date() },
        },
        { upsert: true, returnDocument: 'after' }
      );

      // If user belongs to a group, update their stats in the group leaderboard
      if (user && user.groupId) {
        const group = await Group.findOne({ groupId: user.groupId });
        if (group) {
          const member = group.members.find((m) => m.userId === userId);
          if (member) {
            member.weeklyFocusMinutes = (member.weeklyFocusMinutes || 0) + addedMinutesTotal;
            member.lastActiveAt = new Date();
          } else {
            group.members.push({
              userId,
              displayName: user.name || 'Member',
              avatarUrl: user.avatarUrl || '',
              weeklyFocusMinutes: addedMinutesTotal,
              currentStreakDays: user.currentStreakDays || 1,
              isOnline: true,
              rank: group.members.length + 1,
              lastActiveAt: new Date(),
            });
          }

          // Re-sort members by weeklyFocusMinutes descending and reassign ranks
          group.members.sort((a, b) => b.weeklyFocusMinutes - a.weeklyFocusMinutes);
          group.members.forEach((m, idx) => {
            m.rank = idx + 1;
          });
          group.memberCount = group.members.length;
          await group.save();
        }
      }
    }

    res.json({ success: true, count: savedSessions.length, addedMinutesTotal });
  } catch (error) {
    console.error('[SessionController] syncSessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 50;

    const sessions = await FocusSession.find({ userId })
      .sort({ startedAt: -1 })
      .limit(limit);

    res.json({ success: true, sessions });
  } catch (error) {
    console.error('[SessionController] getUserSessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
