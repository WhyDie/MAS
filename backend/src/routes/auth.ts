import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/validate', authMiddleware, authController.validateToken);
router.post('/create-invite', authMiddleware, authController.createInviteCode);
router.get('/invite-codes', authMiddleware, authController.getInviteCodes);

export default router;
