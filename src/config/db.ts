import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/focusli';
    console.log('[DB] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('[DB] MongoDB connected successfully');
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error);
    // Don't crash immediately, allow server to boot and retry
  }
};
