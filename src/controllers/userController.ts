import { Request, Response } from 'express';
import { User } from '../models/User';

export const syncUser = async (req: Request, res: Response) => {
  try {
    const { userId, name, email, avatarUrl, focusGoalHours, focusingSince } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...(name && { name }),
          ...(email !== undefined && { email }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(focusGoalHours && { focusGoalHours }),
          ...(focusingSince && { focusingSince }),
          lastActiveAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('[UserController] syncUser error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('[UserController] getUser error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
