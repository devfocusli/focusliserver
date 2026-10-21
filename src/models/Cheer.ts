import mongoose, { Schema, Document } from 'mongoose';

export interface ICheer extends Document {
  groupId: string;
  fromUserId: string;
  fromName: string;
  toMemberName: string;
  emoji: string;
  createdAt: Date;
}

const CheerSchema = new Schema<ICheer>(
  {
    groupId: { type: String, required: true, index: true },
    fromUserId: { type: String, required: true },
    fromName: { type: String, required: true },
    toMemberName: { type: String, required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 604800 }, // 7 days TTL
  }
);

export const Cheer = mongoose.model<ICheer>('Cheer', CheerSchema);
