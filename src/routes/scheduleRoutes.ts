import { Router } from 'express';
import {
  syncSchedules,
  getUserSchedules,
  deleteSchedule,
} from '../controllers/scheduleController';

const router = Router();

router.post('/sync', syncSchedules);
router.get('/user/:userId', getUserSchedules);
router.delete('/:userId/:scheduleId', deleteSchedule);

export default router;
