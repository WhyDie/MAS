import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// --- Існуючі маршрути ---
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/validate', authMiddleware, authController.validateToken);
router.post('/invite-codes', authMiddleware, authController.createInviteCode);
router.get('/invite-codes', authMiddleware, authController.getInviteCodes);

router.post('/2fa/verify-login', authController.verifyLogin2FA);
router.post('/2fa/send-login-email', authController.sendLoginEmailCode);
// --- Нові маршрути для 2FA ---

// Генерація секрету для додатку-аутентифікатора
router.post(
  '/2fa/generate-authenticator',
  authMiddleware,
  authController.generateAuthenticator
);

// Перевірка та увімкнення 2FA через додаток
router.post(
  '/2fa/verify-authenticator',
  authMiddleware,
  authController.verifyAuthenticator
);

// Вимкнення методу 2FA (аутентифікатор, біометрія)
router.post(
  '/2fa/disable',
  authMiddleware,
  authController.disable2FA
);

// Увімкнення/вимкнення 2FA через код на пошту
router.post(
  '/2fa/toggle-email',
  authMiddleware,
  authController.toggleEmail2FA
);

router.post('/2fa/setup-email', authMiddleware, authController.setupEmail2FA);
router.post('/2fa/setup-biometrics', authMiddleware, authController.setupBiometrics);

export default router;