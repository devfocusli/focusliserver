import { Request, Response } from 'express';
import { Schedule } from '../models/Schedule';

export const syncSchedules = async (req: Request, res: Response) => {
  try {
    const { userId, schedules } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const scheduleList = Array.isArray(schedules) ? schedules : [schedules];
    const savedSchedules = [];

    for (const s of scheduleList) {
      if (!s || !s.id) continue;
      const doc = await Schedule.findOneAndUpdate(
        { scheduleId: s.id, userId },
        {
          $set: {
            title: s.title || 'Focus Routine',
            startHour: s.startHour,
            startMinute: s.startMinute,
            endHour: s.endHour,
            endMinute: s.endMinute,
            daysOfWeek: s.daysOfWeek || [],
            isEnabled: s.isEnabled !== false,
            blockedPackages: s.blockedPackages || [],
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      savedSchedules.push(doc);
    }

    res.json({ success: true, count: savedSchedules.length, schedules: savedSchedules });
  } catch (error) {
    console.error('[ScheduleController] syncSchedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserSchedules = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const schedules = await Schedule.find({ userId });
    res.json({ success: true, schedules });
  } catch (error) {
    console.error('[ScheduleController] getUserSchedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const scheduleId = String(req.params.scheduleId);
    await Schedule.findOneAndDelete({ userId, scheduleId });
    res.json({ success: true, message: 'Deleted schedule' });
  } catch (error) {
    console.error('[ScheduleController] deleteSchedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
