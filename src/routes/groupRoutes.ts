import { Router } from 'express';
import {
  getPublicGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  sendCheer,
  getCheers,
} from '../controllers/groupController';

const router = Router();

router.get('/', getPublicGroups);
router.get('/:id', getGroup);
router.post('/', createGroup);
router.post('/join', joinGroup);
router.post('/leave', leaveGroup);
router.post('/:id/cheer', sendCheer);
router.get('/:id/cheers', getCheers);

export default router;
