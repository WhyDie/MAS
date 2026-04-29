import { Router } from 'express';
import MentorRequest from '../models/MentorRequest';
// import { protect, authorize } from '../middlewares/auth'; // розкоментуйте ваші мідлвари

const router = Router();

// Отримати всі запити (для ментора)
router.get('/requests', /* protect, authorize('mentor', 'commander', 'admin'), */ async (req, res) => {
  try {
    // У реальному додатку ви б фільтрували по req.user.id
    const requests = await MentorRequest.find().sort({ _id: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Помилка сервера' });
  }
});

// Оновити статус запиту (для ментора)
router.put('/requests/:id/status', /* protect, */ async (req, res) => {
  try {
    const { status } = req.body;
    const request = await MentorRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!request) return res.status(404).json({ success: false, error: 'Запит не знайдено' });
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Помилка сервера' });
  }
});

// Отримати список підопічних
router.get('/mentees', /* protect, */ async (req, res) => {
  try {
    // Заглушка: тут має бути пошук користувачів, які прив'язані до цього ментора
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Помилка сервера' });
  }
});

// Створити новий запит (для бійця)
router.post('/requests', /* protect, */ async (req, res) => {
  try {
    // У реальному додатку soldier = req.user.lastName
    const { soldier, topic, text } = req.body;
    const newRequest = await MentorRequest.create({ soldier, topic, text });
    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Помилка створення запиту' });
  }
});

export default router;