import { Router } from 'express';
import { MentorshipController } from '../controllers/MentorshipController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/mentorship/requests
 * Create new mentorship request (recruits only)
 */
router.post('/requests', authMiddleware, roleMiddleware('recruit'), MentorshipController.createRequest);

/**
 * GET /api/mentorship/requests/open
 * Get open mentorship requests (anyone can view)
 */
router.get('/requests/open', authMiddleware, MentorshipController.getOpenRequests);

/**
 * GET /api/mentorship/mentor/requests
 * Get mentor's assigned requests
 */
router.get('/mentor/requests', authMiddleware, roleMiddleware('mentor'), MentorshipController.getMentorRequests);

/**
 * GET /api/mentorship/recruit/requests
 * Get recruit's mentorship requests
 */
router.get('/recruit/requests', authMiddleware, roleMiddleware('recruit'), MentorshipController.getRecruitRequests);

/**
 * POST /api/mentorship/requests/:id/accept
 * Accept mentorship request (mentors only)
 */
router.post('/requests/:id/accept', authMiddleware, roleMiddleware('mentor'), MentorshipController.acceptRequest);

/**
 * POST /api/mentorship/requests/:id/respond
 * Respond to mentorship request (mentors only)
 */
router.post('/requests/:id/respond', authMiddleware, roleMiddleware('mentor'), MentorshipController.respondToRequest);

/**
 * POST /api/mentorship/requests/:id/complete
 * Complete mentorship request
 */
router.post('/requests/:id/complete', authMiddleware, MentorshipController.completeRequest);

/**
 * POST /api/mentorship/requests/:id/cancel
 * Cancel mentorship request
 */
router.post('/requests/:id/cancel', authMiddleware, MentorshipController.cancelRequest);

/**
 * POST /api/mentorship/requests/:id/feedback
 * Add feedback to mentorship
 */
router.post('/requests/:id/feedback', authMiddleware, MentorshipController.addFeedback);

/**
 * GET /api/mentorship/mentors/available
 * Get available mentors
 */
router.get('/mentors/available', authMiddleware, MentorshipController.getAvailableMentors);

/**
 * GET /api/mentorship/mentors/search
 * Search mentors by skills
 */
router.get('/mentors/search', authMiddleware, MentorshipController.searchMentors);

/**
 * GET /api/mentorship/mentor/stats
 * Get mentor statistics
 */
router.get('/mentor/stats', authMiddleware, roleMiddleware('mentor'), MentorshipController.getMentorStats);

/**
 * GET /api/mentorship/recommend
 * Get recommended mentor for recruit
 */
router.get('/recommend', authMiddleware, roleMiddleware('recruit'), MentorshipController.getRecommendedMentor);

export default router;
