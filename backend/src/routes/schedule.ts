import { Router } from 'express';
import { ScheduleController } from '../controllers/ScheduleController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/schedule/events
 * Get schedule events for date range
 */
router.get('/events', authMiddleware, ScheduleController.getEvents);

/**
 * GET /api/schedule/user/:userId/date/:date
 * Get user's daily schedule
 */
router.get('/user/:userId/date/:date', authMiddleware, ScheduleController.getUserDailySchedule);

/**
 * GET /api/schedule/unit/:unitId/week
 * Get week schedule
 */
router.get('/unit/:unitId/week', authMiddleware, ScheduleController.getWeekSchedule);

/**
 * GET /api/schedule/unit/:unitId/upcoming
 * Get upcoming events
 */
router.get('/unit/:unitId/upcoming', authMiddleware, ScheduleController.getUpcomingEvents);

/**
 * GET /api/schedule/unit/:unitId/stats
 * Get daily statistics
 */
router.get('/unit/:unitId/stats', authMiddleware, ScheduleController.getDailyStats);

/**
 * POST /api/schedule/events
 * Create new event (Commander only)
 */
router.post('/events', authMiddleware, roleMiddleware('commander', 'admin', 'superadmin'), ScheduleController.createEvent);

/**
 * PUT /api/schedule/events/:id
 * Update event (Commander only)
 */
router.put('/events/:id', authMiddleware, roleMiddleware('commander', 'admin', 'superadmin'), ScheduleController.updateEvent);

/**
 * DELETE /api/schedule/events/:id
 * Delete event (Commander only)
 */
router.delete('/events/:id', authMiddleware, roleMiddleware('commander', 'admin', 'superadmin'), ScheduleController.deleteEvent);

/**
 * PATCH /api/schedule/events/:id/status
 * Update event status
 */
router.patch('/events/:id/status', authMiddleware, ScheduleController.updateEventStatus);

export default router;
