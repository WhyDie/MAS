import { Router } from 'express';
import PsychologistRequest from '../models/PsychologistRequest';
// import { protect, authorize } from '../middlewares/auth'; // розкоментуйте ваші мідлвари

const router = Router();

// Отримати всі психологічні запити (для психолога)
router.get('/requests', /* protect, authorize('psychologist', 'commander', 'admin'), */ async (req, res) => {
  try {
    const requests = await PsychologistRequest.find().sort({ _id: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Помилка сервера' });
  }
});

// Оновити статус запиту (для психолога)
router.put('/requests/:id/status', /* protect, */ async (req, res) => {
  try {
    const { status } = req.body;
    const request = await PsychologistRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!request) return res.status(404).json({ success: false, error: 'Запит не знайдено' });
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Помилка сервера' });
  }
});

// Отримати аналітику настрою
router.get('/analytics', /* protect, */ async (req, res) => {
  try {
    // Тут має бути агрегація з БД опитувань. Поки повертаємо базовий об'єкт.
    const stats = { totalPolled: 0, good: 0, normal: 0, stressed: 0, critical: 0 };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Помилка сервера' });
  }
});

// Створити запит на психологічну підтримку (для бійця)
router.post('/requests', /* protect, */ async (req, res) => {
  try {
    const { isAnonymous, topic, severity } = req.body;
    const type = isAnonymous ? 'Анонімно' : 'Боєць'; // Тут можна підтягувати ім'я з req.user
    const newRequest = await PsychologistRequest.create({ type, topic, severity });
    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Помилка створення запиту' });
  }
});

export default router;