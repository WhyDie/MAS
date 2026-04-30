import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Оновлення розширеного профілю користувача
// (ім'я, прізвище, позивний, звання, посада, іконка і т.д.)
router.put(
  '/profile-extended',
  authMiddleware,
  userController.updateProfile
);

// Зміна пароля користувача
router.put(
  '/change-password',
  authMiddleware,
  userController.changePassword
);

// Видалення власного акаунту
router.delete(
  '/me',
  authMiddleware,
  userController.deleteAccount
);

export default router;