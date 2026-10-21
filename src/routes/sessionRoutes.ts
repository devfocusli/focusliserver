import { Router } from 'express';
import { syncSessions, getUserSessions } from '../controllers/sessionController';

const router = Router();

router.post('/sync', syncSessions);
router.get('/user/:userId', getUserSessions);

export default router;
