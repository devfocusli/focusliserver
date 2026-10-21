import { Request, Response } from 'express';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { Cheer } from '../models/Cheer';

const SEED_SUGGESTED_GROUPS = [
  {
    groupId: 'sg-1',
    name: 'MHTCET 2027 Study Room',
    description: 'Daily intense study room for MHTCET engineering & pharmacy aspirants.',
    inviteCode: 'MHTCET27',
    category: 'Exam Prep',
    memberCount: 388,
    members: [
      {
        userId: 'bot-1',
        displayName: 'Aarav (Rank 1)',
        avatarUrl: '',
        weeklyFocusMinutes: 1450,
        currentStreakDays: 14,
        isOnline: true,
        rank: 1,
        lastActiveAt: new Date(),
      },
      {
        userId: 'bot-2',
        displayName: 'Priya (Rank 2)',
        avatarUrl: '',
        weeklyFocusMinutes: 1220,
        currentStreakDays: 9,
        isOnline: true,
        rank: 2,
        lastActiveAt: new Date(),
      },
    ],
  },
  {
    groupId: 'sg-2',
    name: 'Railway & Civil Self Study',
    description: 'Silent study block for RRB, SSC, and Civil Services preparation.',
    inviteCode: 'CIVILRRB',
    category: 'Competitive',
    memberCount: 274,
    members: [
      {
        userId: 'bot-3',
        displayName: 'Rohan Sharma',
        avatarUrl: '',
        weeklyFocusMinutes: 1680,
        currentStreakDays: 21,
        isOnline: true,
        rank: 1,
        lastActiveAt: new Date(),
      },
    ],
  },
  {
    groupId: 'sg-3',
    name: 'BTech Engineers Focus Block',
    description: 'Coding, DSA, core subjects and interview prep deep work sprint.',
    inviteCode: 'BTECHENG',
    category: 'Tech & Code',
    memberCount: 4800,
    members: [
      {
        userId: 'bot-4',
        displayName: 'DevGuru',
        avatarUrl: '',
        weeklyFocusMinutes: 1950,
        currentStreakDays: 30,
        isOnline: true,
        rank: 1,
        lastActiveAt: new Date(),
      },
    ],
  },
];

export const getPublicGroups = async (_req: Request, res: Response) => {
  try {
    let groups = await Group.find().sort({ memberCount: -1 }).limit(20);

    // Seed defaults if database has no groups yet
    if (groups.length === 0) {
      for (const sg of SEED_SUGGESTED_GROUPS) {
        await Group.create(sg);
      }
      groups = await Group.find().sort({ memberCount: -1 });
    }

    res.json({ success: true, groups });
  } catch (error) {
    console.error('[GroupController] getPublicGroups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGroup = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const group = await Group.findOne({ $or: [{ groupId: id }, { inviteCode: id.toUpperCase() }] });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Sort members by weekly focus minutes descending
    group.members.sort((a, b) => b.weeklyFocusMinutes - a.weeklyFocusMinutes);
    group.members.forEach((m, idx) => {
      m.rank = idx + 1;
    });

    res.json({ success: true, group });
  } catch (error) {
    console.error('[GroupController] getGroup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { userId, name, description, category } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    const user = await User.findOne({ userId });
    const displayName = user?.name || 'You';
    const weeklyFocusMinutes = user?.weeklyFocusMinutes || 0;
    const currentStreakDays = user?.currentStreakDays || 1;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const inviteCode = 'FOCUS-' + randomSuffix;
    const groupId = 'grp-' + Date.now();

    const newGroup = await Group.create({
      groupId,
      name,
      description: description || 'Our weekly focus goals and targets',
      inviteCode,
      category: category || 'General',
      memberCount: 1,
      createdBy: userId,
      members: [
        {
          userId,
          displayName,
          avatarUrl: user?.avatarUrl || '',
          weeklyFocusMinutes,
          currentStreakDays,
          isOnline: true,
          rank: 1,
          lastActiveAt: new Date(),
        },
      ],
    });

    // Update user's current group
    await User.findOneAndUpdate({ userId }, { $set: { groupId } });

    res.status(201).json({ success: true, group: newGroup });
  } catch (error) {
    console.error('[GroupController] createGroup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinGroup = async (req: Request, res: Response) => {
  try {
    const { userId, inviteCode, groupId } = req.body;
    if (!userId || (!inviteCode && !groupId)) {
      return res.status(400).json({ error: 'userId and inviteCode or groupId are required' });
    }

    const query = inviteCode
      ? { inviteCode: inviteCode.trim().toUpperCase() }
      : { groupId };

    const group = await Group.findOne(query);
    if (!group) {
      return res.status(404).json({ error: 'Invalid group or invite code' });
    }

    const user = await User.findOne({ userId });
    const displayName = user?.name || 'You';
    const weeklyFocusMinutes = user?.weeklyFocusMinutes || 0;
    const currentStreakDays = user?.currentStreakDays || 1;

    // Check if already a member
    const existingIndex = group.members.findIndex((m) => m.userId === userId);
    if (existingIndex >= 0) {
      group.members[existingIndex].displayName = displayName;
      group.members[existingIndex].weeklyFocusMinutes = Math.max(
        group.members[existingIndex].weeklyFocusMinutes,
        weeklyFocusMinutes
      );
      group.members[existingIndex].isOnline = true;
      group.members[existingIndex].lastActiveAt = new Date();
    } else {
      group.members.push({
        userId,
        displayName,
        avatarUrl: user?.avatarUrl || '',
        weeklyFocusMinutes,
        currentStreakDays,
        isOnline: true,
        rank: group.members.length + 1,
        lastActiveAt: new Date(),
      });
      group.memberCount += 1;
    }

    group.members.sort((a, b) => b.weeklyFocusMinutes - a.weeklyFocusMinutes);
    group.members.forEach((m, idx) => {
      m.rank = idx + 1;
    });

    await group.save();
    await User.findOneAndUpdate({ userId }, { $set: { groupId: group.groupId } });

    res.json({ success: true, group });
  } catch (error) {
    console.error('[GroupController] joinGroup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await User.findOne({ userId });
    if (user && user.groupId) {
      const group = await Group.findOne({ groupId: user.groupId });
      if (group) {
        group.members = group.members.filter((m) => m.userId !== userId);
        group.memberCount = Math.max(0, group.memberCount - 1);
        group.members.sort((a, b) => b.weeklyFocusMinutes - a.weeklyFocusMinutes);
        group.members.forEach((m, idx) => {
          m.rank = idx + 1;
        });
        await group.save();
      }
      user.groupId = null;
      await user.save();
    }

    res.json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    console.error('[GroupController] leaveGroup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendCheer = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { fromUserId, fromName, toMemberName, emoji } = req.body;

    if (!id || !fromUserId || !toMemberName || !emoji) {
      return res.status(400).json({ error: 'Missing cheer parameters' });
    }

    const cheer = await Cheer.create({
      groupId: id,
      fromUserId,
      fromName: fromName || 'A teammate',
      toMemberName,
      emoji,
    });

    res.status(201).json({ success: true, cheer });
  } catch (error) {
    console.error('[GroupController] sendCheer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCheers = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const cheers = await Cheer.find({ groupId: id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, cheers });
  } catch (error) {
    console.error('[GroupController] getCheers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
