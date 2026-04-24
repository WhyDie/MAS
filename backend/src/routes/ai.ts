import { Router, Request, Response } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

/**
 * POST /api/ai/chat
 * Chat with AI assistant
 */
router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return sendError(res, 'Message is required', 400);
    }

    if (message.length > 2000) {
      return sendError(res, 'Message is too long (max 2000 characters)', 400);
    }

    // Import AI service dynamically
    const { chatWithAI } = await import('../services/AIService');
    const result = await chatWithAI(message.trim());

    sendSuccess(res, { message: result.message });
  } catch (error) {
    console.error('AI chat error:', error);
    sendError(res, 'Error processing request', 500);
  }
});

/**
 * GET /api/ai/status
 * Get AI service status
 */
router.get('/status', authMiddleware, (req: Request, res: Response) => {
  const hasApiKey = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 10);
  
  sendSuccess(res, {
    mode: hasApiKey ? 'cloud' : 'local',
    model: hasApiKey ? 'nvidia/nemotron-nano-9b-v2:free' : 'smart-fallback',
    features: [
      'Навчальні модулі',
      'Розпорядок',
      'Профіль',
      'Симулятори',
      'Коди доступу',
      'Безпека',
    ],
  });
});

export default router;
