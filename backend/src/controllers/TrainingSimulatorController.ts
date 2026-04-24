import { Request, Response } from 'express';
import { TrainingSimulatorService } from '../services/TrainingSimulatorService';
import { SimulatorType, SimulatorDifficulty } from '../models/TrainingSimulator';
import { sendSuccess, sendError } from '../utils/response';

const simulatorService = new TrainingSimulatorService();

export class TrainingSimulatorController {
  /**
   * Get all simulators with optional filtering
   * GET /api/training-simulators?category=&type=&difficulty=&page=&limit=
   */
  static async getAllSimulators(req: Request, res: Response) {
    try {
      const { category, type, difficulty, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const result = await simulatorService.getAllSimulators(
        category as string,
        type as SimulatorType,
        difficulty as SimulatorDifficulty,
        parseInt(limit as string),
        offset
      );

      sendSuccess(res, result);
    } catch (error) {
      console.error('Error fetching simulators:', error);
      sendError(res, 'Error fetching simulators', 500);
    }
  }

  /**
   * Get simulator by ID
   * GET /api/training-simulators/:id
   */
  static async getSimulator(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const simulator = await simulatorService.getSimulator(id);

      if (!simulator) {
        return sendError(res, 'Simulator not found', 404);
      }

      sendSuccess(res, simulator);
    } catch (error) {
      console.error('Error fetching simulator:', error);
      sendError(res, 'Error fetching simulator', 500);
    }
  }

  /**
   * Get simulators by category
   * GET /api/training-simulators/category/:category
   */
  static async getByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const { limit = 10 } = req.query;

      const simulators = await simulatorService.getSimulatorsByCategory(
        category,
        parseInt(limit as string)
      );

      sendSuccess(res, simulators);
    } catch (error) {
      console.error('Error fetching simulators by category:', error);
      sendError(res, 'Error fetching simulators', 500);
    }
  }

  /**
   * Get simulators by type
   * GET /api/training-simulators/type/:type
   */
  static async getByType(req: Request, res: Response) {
    try {
      const { type } = req.params;

      if (!Object.values(SimulatorType).includes(type as SimulatorType)) {
        return sendError(res, 'Invalid simulator type', 400);
      }

      const simulators = await simulatorService.getSimulatorsByType(
        type as SimulatorType,
        10
      );

      sendSuccess(res, simulators);
    } catch (error) {
      console.error('Error fetching simulators by type:', error);
      sendError(res, 'Error fetching simulators', 500);
    }
  }

  /**
   * Get simulators by difficulty
   * GET /api/training-simulators/difficulty/:difficulty
   */
  static async getByDifficulty(req: Request, res: Response) {
    try {
      const { difficulty } = req.params;

      if (!Object.values(SimulatorDifficulty).includes(difficulty as SimulatorDifficulty)) {
        return sendError(res, 'Invalid difficulty level', 400);
      }

      const simulators = await simulatorService.getSimulatorsByDifficulty(
        difficulty as SimulatorDifficulty,
        10
      );

      sendSuccess(res, simulators);
    } catch (error) {
      console.error('Error fetching simulators by difficulty:', error);
      sendError(res, 'Error fetching simulators', 500);
    }
  }

  /**
   * Start new simulator attempt
   * POST /api/training-simulators/:simulatorId/start
   */
  static async startAttempt(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { simulatorId } = req.params;

      const attempt = await simulatorService.startAttempt(userId, simulatorId);

      sendSuccess(res, attempt, 'Simulator attempt started', 201);
    } catch (error) {
      console.error('Error starting attempt:', error);
      sendError(res, 'Error starting simulator', 500);
    }
  }

  /**
   * Handle scenario choice
   * POST /api/training-simulators/attempt/:attemptId/choice
   */
  static async handleScenarioChoice(req: Request, res: Response) {
    try {
      const { attemptId } = req.params;
      const { nodeId, choiceIndex } = req.body;

      if (nodeId === undefined || choiceIndex === undefined) {
        return sendError(res, 'nodeId and choiceIndex are required', 400);
      }

      const attempt = await simulatorService.handleScenarioChoice(
        attemptId,
        nodeId,
        choiceIndex
      );

      sendSuccess(res, attempt);
    } catch (error) {
      console.error('Error handling scenario choice:', error);
      sendError(res, 'Error processing choice', 500);
    }
  }

  /**
   * Handle quiz answer
   * POST /api/training-simulators/attempt/:attemptId/answer
   */
  static async handleQuizAnswer(req: Request, res: Response) {
    try {
      const { attemptId } = req.params;
      const { questionId, answerIndex } = req.body;

      if (questionId === undefined || answerIndex === undefined) {
        return sendError(res, 'questionId and answerIndex are required', 400);
      }

      const attempt = await simulatorService.handleQuizAnswer(
        attemptId,
        questionId,
        answerIndex
      );

      sendSuccess(res, attempt);
    } catch (error) {
      console.error('Error handling quiz answer:', error);
      sendError(res, 'Error processing answer', 500);
    }
  }

  /**
   * Complete simulator attempt
   * POST /api/training-simulators/attempt/:attemptId/complete
   */
  static async completeAttempt(req: Request, res: Response) {
    try {
      const { attemptId } = req.params;

      const attempt = await simulatorService.completeAttempt(attemptId);

      sendSuccess(res, attempt, 'Simulator completed');
    } catch (error) {
      console.error('Error completing attempt:', error);
      sendError(res, 'Error completing simulator', 500);
    }
  }

  /**
   * Abandon simulator attempt
   * POST /api/training-simulators/attempt/:attemptId/abandon
   */
  static async abandonAttempt(req: Request, res: Response) {
    try {
      const { attemptId } = req.params;

      const attempt = await simulatorService.abandonAttempt(attemptId);

      sendSuccess(res, attempt, 'Simulator abandoned');
    } catch (error) {
      console.error('Error abandoning attempt:', error);
      sendError(res, 'Error abandoning simulator', 500);
    }
  }

  /**
   * Get user's attempts for a simulator
   * GET /api/training-simulators/:simulatorId/my-attempts
   */
  static async getUserAttempts(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { simulatorId } = req.params;

      const attempts = await simulatorService.getUserSimulatorAttempts(userId, simulatorId);

      sendSuccess(res, attempts);
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      sendError(res, 'Error fetching attempts', 500);
    }
  }

  /**
   * Get user's best attempt for a simulator
   * GET /api/training-simulators/:simulatorId/best-attempt
   */
  static async getBestAttempt(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { simulatorId } = req.params;

      const attempt = await simulatorService.getUserBestAttempt(userId, simulatorId);

      if (!attempt) {
        return sendSuccess(res, null, 'No completed attempts');
      }

      sendSuccess(res, attempt);
    } catch (error) {
      console.error('Error fetching best attempt:', error);
      sendError(res, 'Error fetching attempt', 500);
    }
  }

  /**
   * Get all user attempts
   * GET /api/training-simulators/my-progress?page=&limit=
   */
  static async getAllUserAttempts(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const result = await simulatorService.getUserAllAttempts(
        userId,
        parseInt(limit as string),
        offset
      );

      sendSuccess(res, result);
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      sendError(res, 'Error fetching attempts', 500);
    }
  }

  /**
   * Get simulator leaderboard
   * GET /api/training-simulators/:simulatorId/leaderboard
   */
  static async getLeaderboard(req: Request, res: Response) {
    try {
      const { simulatorId } = req.params;
      const { limit = 10 } = req.query;

      const leaderboard = await simulatorService.getSimulatorLeaderboard(
        simulatorId,
        parseInt(limit as string)
      );

      sendSuccess(res, leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      sendError(res, 'Error fetching leaderboard', 500);
    }
  }

  /**
   * Get user statistics
   * GET /api/training-simulators/stats
   */
  static async getUserStats(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const stats = await simulatorService.getUserStatistics(userId);

      sendSuccess(res, stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      sendError(res, 'Error fetching statistics', 500);
    }
  }

  /**
   * Get recommended simulators
   * GET /api/training-simulators/recommended?limit=
   */
  static async getRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { limit = 5 } = req.query;

      const recommended = await simulatorService.getRecommendedSimulators(
        userId,
        parseInt(limit as string)
      );

      sendSuccess(res, recommended);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      sendError(res, 'Error fetching recommendations', 500);
    }
  }

  /**
   * Get categories
   * GET /api/training-simulators/categories
   */
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await simulatorService.getCategories();

      sendSuccess(res, { categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      sendError(res, 'Error fetching categories', 500);
    }
  }

  /**
   * Search simulators
   * GET /api/training-simulators/search?q=
   */
  static async search(req: Request, res: Response) {
    try {
      const { q, limit = 20 } = req.query;

      if (!q) {
        return sendError(res, 'Search query is required', 400);
      }

      const results = await simulatorService.searchSimulators(q as string, parseInt(limit as string));

      sendSuccess(res, results);
    } catch (error) {
      console.error('Error searching simulators:', error);
      sendError(res, 'Error searching simulators', 500);
    }
  }

  /**
   * Create simulator (admin)
   * POST /api/training-simulators
   */
  static async createSimulator(req: Request, res: Response) {
    try {
      const data = req.body;

      if (!data.title || !data.type || !data.difficulty) {
        return sendError(res, 'title, type, and difficulty are required', 400);
      }

      const simulator = await simulatorService.createSimulator(data);

      sendSuccess(res, simulator, 'Simulator created', 201);
    } catch (error) {
      console.error('Error creating simulator:', error);
      sendError(res, 'Error creating simulator', 500);
    }
  }

  /**
   * Update simulator (admin)
   * PUT /api/training-simulators/:id
   */
  static async updateSimulator(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const simulator = await simulatorService.updateSimulator(id, data);

      sendSuccess(res, simulator, 'Simulator updated');
    } catch (error) {
      console.error('Error updating simulator:', error);
      sendError(res, 'Error updating simulator', 500);
    }
  }

  /**
   * Delete simulator (admin)
   * DELETE /api/training-simulators/:id
   */
  static async deleteSimulator(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await simulatorService.deleteSimulator(id);

      sendSuccess(res, null, 'Simulator deleted');
    } catch (error) {
      console.error('Error deleting simulator:', error);
      sendError(res, 'Error deleting simulator', 500);
    }
  }

  static async reorderSimulators(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
      if (!['commander', 'admin', 'superadmin'].includes(req.user.role)) { sendError(res, 'Insufficient permissions', 403); return; }
      const { ids }: { ids: string[] } = req.body;
      if (!Array.isArray(ids)) { sendError(res, 'ids must be an array', 400); return; }
      const simulatorService = new TrainingSimulatorService();
      await simulatorService.reorderSimulators(ids);
      sendSuccess(res, { ids }, 'Simulators reordered successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to reorder simulators', 400);
    }
  }
}
