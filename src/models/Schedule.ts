import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  scheduleId: string;
  userId: string;
  title: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  daysOfWeek: number[];
  isEnabled: boolean;
  blockedPackages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    scheduleId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    startHour: { type: Number, required: true },
    startMinute: { type: Number, required: true },
    endHour: { type: Number, required: true },
    endMinute: { type: Number, required: true },
    daysOfWeek: [{ type: Number }],
    isEnabled: { type: Boolean, default: true },
    blockedPackages: [{ type: String }],
  },
  { timestamps: true }
);

ScheduleSchema.index({ userId: 1, scheduleId: 1 }, { unique: true });

export const Schedule = mongoose.model<ISchedule>('Schedule', ScheduleSchema);
