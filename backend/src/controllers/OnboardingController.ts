import { Request, Response } from 'express';
import { OnboardingService } from '../services/OnboardingService';
import { sendSuccess, sendError } from '../utils/response';

const onboardingService = new OnboardingService();

export class OnboardingController {
  /**
   * Generate personalized learning trajectory
   * POST /api/onboarding/generate-trajectory
   */
  static async generateTrajectory(req: Request, res: Response) {
    try {
      const { profileAnswers } = req.body;

      if (!profileAnswers) {
        return sendError(res, 'Profile answers are required', 400);
      }

      const trajectory = onboardingService.generateTrajectory(profileAnswers);
      sendSuccess(res, trajectory, 'Trajectory generated successfully');
    } catch (error) {
      console.error('Error generating trajectory:', error);
      sendError(res, 'Error generating trajectory', 500);
    }
  }

  /**
   * Complete onboarding and save record
   * POST /api/onboarding/complete
   */
  static async completeOnboarding(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { profileAnswers, trajectory } = req.body;

      if (!profileAnswers || !trajectory) {
        return sendError(res, 'Profile answers and trajectory are required', 400);
      }

      const onboarding = await onboardingService.saveOnboarding(
        userId,
        profileAnswers,
        trajectory
      );

      sendSuccess(res, onboarding, 'Onboarding completed successfully');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      sendError(res, 'Error completing onboarding', 500);
    }
  }

  /**
   * Get user's onboarding data
   * GET /api/onboarding/status
   */
  static async getOnboardingStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const onboarding = await onboardingService.getUserOnboarding(userId);

      if (!onboarding) {
        return sendSuccess(res, { isCompleted: false, data: null });
      }

      sendSuccess(res, {
        isCompleted: onboarding.isCompleted,
        progress: onboarding.progress,
        trajectory: onboarding.generatedTrajectory,
        profileAnswers: onboarding.profileAnswers
      });
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      sendError(res, 'Error fetching onboarding status', 500);
    }
  }

  /**
   * Update onboarding progress
   * PUT /api/onboarding/progress
   */
  static async updateProgress(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { completedModules, totalModules } = req.body;

      if (completedModules === undefined || totalModules === undefined) {
        return sendError(res, 'Completed and total modules count are required', 400);
      }

      const updated = await onboardingService.updateProgress(
        userId,
        completedModules,
        totalModules
      );

      sendSuccess(res, updated.progress, 'Progress updated successfully');
    } catch (error) {
      console.error('Error updating progress:', error);
      sendError(res, 'Error updating progress', 500);
    }
  }

  /**
   * Get personalized recommendations
   * GET /api/onboarding/recommendations
   */
  static async getRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const onboarding = await onboardingService.getUserOnboarding(userId);

      if (!onboarding) {
        return sendError(res, 'Onboarding record not found', 404);
      }

      sendSuccess(res, {
        recommendations: onboarding.generatedTrajectory.personalRecommendations,
        trajectory: onboarding.generatedTrajectory.trajectory,
        nextStep: onboarding.generatedTrajectory.roadmap[0]?.modules[0]
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      sendError(res, 'Error fetching recommendations', 500);
    }
  }
}
