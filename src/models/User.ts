import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  focusGoalHours: number;
  focusingSince: string;
  totalFocusMinutes: number;
  weeklyFocusMinutes: number;
  currentStreakDays: number;
  groupId?: string | null;
  lastActiveAt: Date;
  welcomeEmailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'Focus Champion', trim: true },
    email: { type: String, default: '', lowercase: true, trim: true, index: true },
    password: { type: String, select: false },
    avatarUrl: { type: String, default: '' },
    focusGoalHours: { type: Number, default: 3, min: 1 },
    focusingSince: { type: String, default: '' },
    totalFocusMinutes: { type: Number, default: 0 },
    weeklyFocusMinutes: { type: Number, default: 0 },
    currentStreakDays: { type: Number, default: 0 },
    groupId: { type: String, default: null },
    lastActiveAt: { type: Date, default: Date.now },
    welcomeEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
