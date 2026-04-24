import { Router } from 'express';
import { syncController } from '../controllers/SyncController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/push', authMiddleware, syncController.pushChanges);
router.get('/pull', authMiddleware, syncController.pullChanges);
router.get('/pending', authMiddleware, syncController.getPendingChanges);
router.post('/resolve/:syncId', authMiddleware, syncController.resolveConflict);

export default router;
