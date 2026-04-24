import { Router } from 'express';
import { trainingController } from '../controllers/TrainingController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

router.get('/modules', optionalAuthMiddleware, trainingController.getAllModules);
router.get('/modules/:id', optionalAuthMiddleware, trainingController.getModuleById);
router.post('/modules', authMiddleware, trainingController.createModule);
router.put('/modules/:id', authMiddleware, trainingController.updateModule);
router.delete('/modules/:id', authMiddleware, trainingController.deleteModule);
router.put('/modules/reorder', authMiddleware, trainingController.reorderModules);
router.get('/progress/:moduleId', authMiddleware, trainingController.getUserProgress);
router.put('/progress/:moduleId', authMiddleware, trainingController.updateUserProgress);
router.get('/stats', authMiddleware, trainingController.getUserStats);

export default router;
