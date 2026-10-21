import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMember {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  weeklyFocusMinutes: number;
  currentStreakDays: number;
  isOnline: boolean;
  rank: number;
  lastActiveAt: Date;
}

export interface IGroup extends Document {
  groupId: string;
  name: string;
  description: string;
  inviteCode: string;
  category: string;
  memberCount: number;
  members: IGroupMember[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    weeklyFocusMinutes: { type: Number, default: 0 },
    currentStreakDays: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: true },
    rank: { type: Number, default: 1 },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroup>(
  {
    groupId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    inviteCode: { type: String, required: true, unique: true, uppercase: true, index: true },
    category: { type: String, default: 'General' },
    memberCount: { type: Number, default: 1 },
    members: [GroupMemberSchema],
    createdBy: { type: String, default: null },
  },
  { timestamps: true }
);

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
