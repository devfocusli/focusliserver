import mongoose, { Schema, Document } from 'mongoose';

export interface IFocusSession extends Document {
  sessionId: string;
  userId: string;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  targetDurationMinutes: number;
  actualDurationSeconds: number;
  startedAt: Date;
  completedAt?: Date;
  isStrictMode: boolean;
  blockedAppsCount: number;
  completed: boolean;
  createdAt: Date;
}

const FocusSessionSchema = new Schema<IFocusSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    mode: { type: String, enum: ['focus', 'shortBreak', 'longBreak'], default: 'focus' },
    targetDurationMinutes: { type: Number, required: true },
    actualDurationSeconds: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    isStrictMode: { type: Boolean, default: false },
    blockedAppsCount: { type: Number, default: 0 },
    completed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FocusSessionSchema.index({ userId: 1, startedAt: -1 });

export const FocusSession = mongoose.model<IFocusSession>('FocusSession', FocusSessionSchema);
