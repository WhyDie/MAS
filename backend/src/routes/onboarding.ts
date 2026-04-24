import { Router } from 'express';
import { OnboardingController } from '../controllers/OnboardingController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/onboarding/generate-trajectory
 * Generate personalized learning trajectory based on profile answers
 */
router.post('/generate-trajectory', OnboardingController.generateTrajectory);

/**
 * POST /api/onboarding/complete
 * Complete onboarding and save the record
 * Requires: Authorization header with JWT token
 */
router.post('/complete', authMiddleware, OnboardingController.completeOnboarding);

/**
 * GET /api/onboarding/status
 * Get user's onboarding status and progress
 * Requires: Authorization header with JWT token
 */
router.get('/status', authMiddleware, OnboardingController.getOnboardingStatus);

/**
 * PUT /api/onboarding/progress
 * Update user's onboarding progress
 * Requires: Authorization header with JWT token
 */
router.put('/progress', authMiddleware, OnboardingController.updateProgress);

/**
 * GET /api/onboarding/recommendations
 * Get personalized recommendations and next steps
 * Requires: Authorization header with JWT token
 */
router.get('/recommendations', authMiddleware, OnboardingController.getRecommendations);

export default router;
