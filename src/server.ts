import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import userRoutes from './routes/userRoutes';
import sessionRoutes from './routes/sessionRoutes';
import groupRoutes from './routes/groupRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Focusli Backend API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/schedules', scheduleRoutes);

// Fallback 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Focusli backend running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
