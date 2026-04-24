import express from 'express';
import { TrainingSimulatorController } from '../controllers/TrainingSimulatorController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Get all simulators with filtering
 * GET /api/training-simulators?category=&type=&difficulty=&page=&limit=
 * Query: category?, type?, difficulty?, page? (default 1), limit? (default 20)
 * Returns: { simulators: TrainingSimulator[], total, page }
 */
router.get('/', TrainingSimulatorController.getAllSimulators);

/**
 * Search simulators
 * GET /api/training-simulators/search?q=
 * Query: q (search query), limit? (default 20)
 * Returns: TrainingSimulator[]
 */
router.get('/search', TrainingSimulatorController.search);

/**
 * Get recommended simulators for user
 * GET /api/training-simulators/recommended?limit=
 * Query: limit? (default 5)
 * Returns: TrainingSimulator[]
 */
router.get('/recommended', TrainingSimulatorController.getRecommendations);

/**
 * Get user statistics
 * GET /api/training-simulators/stats
 * Returns: { totalAttempts, completedAttempts, passedAttempts, averageScore, totalTimeSpent }
 */
router.get('/my-stats', TrainingSimulatorController.getUserStats);

/**
 * Get all user attempts across simulators
 * GET /api/training-simulators/my-progress?page=&limit=
 * Query: page? (default 1), limit? (default 20)
 * Returns: { attempts: SimulatorAttempt[], total }
 */
router.get('/my-progress', TrainingSimulatorController.getAllUserAttempts);

/**
 * Get categories
 * GET /api/training-simulators/categories
 * Returns: { categories: string[] }
 */
router.get('/categories', TrainingSimulatorController.getCategories);

/**
 * Get simulators by category
 * GET /api/training-simulators/category/:category?limit=
 * Params: category
 * Query: limit? (default 10)
 * Returns: TrainingSimulator[]
 */
router.get('/category/:category', TrainingSimulatorController.getByCategory);

/**
 * Get simulators by type
 * GET /api/training-simulators/type/:type
 * Params: type (scenario | quiz | combat_drill | survival | communication)
 * Returns: TrainingSimulator[]
 */
router.get('/type/:type', TrainingSimulatorController.getByType);

/**
 * Get simulators by difficulty
 * GET /api/training-simulators/difficulty/:difficulty
 * Params: difficulty (easy | normal | hard | extreme)
 * Returns: TrainingSimulator[]
 */
router.get('/difficulty/:difficulty', TrainingSimulatorController.getByDifficulty);

/**
 * Get simulator by ID
 * GET /api/training-simulators/:id
 * Returns: TrainingSimulator
 */
router.get('/:id', TrainingSimulatorController.getSimulator);

/**
 * Get simulator leaderboard
 * GET /api/training-simulators/:simulatorId/leaderboard?limit=
 * Params: simulatorId
 * Query: limit? (default 10)
 * Returns: SimulatorAttempt[] (top scores)
 */
router.get('/:simulatorId/leaderboard', TrainingSimulatorController.getLeaderboard);

/**
 * Get user's attempts for simulator
 * GET /api/training-simulators/:simulatorId/my-attempts
 * Params: simulatorId
 * Returns: SimulatorAttempt[]
 */
router.get('/:simulatorId/my-attempts', TrainingSimulatorController.getUserAttempts);

/**
 * Get user's best attempt for simulator
 * GET /api/training-simulators/:simulatorId/best-attempt
 * Params: simulatorId
 * Returns: SimulatorAttempt | null
 */
router.get('/:simulatorId/best-attempt', TrainingSimulatorController.getBestAttempt);

/**
 * Start new simulator attempt
 * POST /api/training-simulators/:simulatorId/start
 * Params: simulatorId
 * Returns: SimulatorAttempt
 */
router.post('/:simulatorId/start', TrainingSimulatorController.startAttempt);

/**
 * Handle scenario choice
 * POST /api/training-simulators/attempt/:attemptId/choice
 * Params: attemptId
 * Body: { nodeId, choiceIndex }
 * Returns: SimulatorAttempt
 */
router.post('/attempt/:attemptId/choice', TrainingSimulatorController.handleScenarioChoice);

/**
 * Handle quiz answer
 * POST /api/training-simulators/attempt/:attemptId/answer
 * Params: attemptId
 * Body: { questionId, answerIndex }
 * Returns: SimulatorAttempt
 */
router.post('/attempt/:attemptId/answer', TrainingSimulatorController.handleQuizAnswer);

/**
 * Complete simulator attempt
 * POST /api/training-simulators/attempt/:attemptId/complete
 * Params: attemptId
 * Returns: SimulatorAttempt (completed)
 */
router.post('/attempt/:attemptId/complete', TrainingSimulatorController.completeAttempt);

/**
 * Abandon simulator attempt
 * POST /api/training-simulators/attempt/:attemptId/abandon
 * Params: attemptId
 * Returns: SimulatorAttempt (abandoned)
 */
router.post('/attempt/:attemptId/abandon', TrainingSimulatorController.abandonAttempt);

// Admin routes (ADMIN role only)
/**
 * Create simulator (admin)
 * POST /api/training-simulators
 * Body: { title, description, type, difficulty, category, estimatedMinutes, tags?, scenarioFlow?, quizContent? }
 * Returns: TrainingSimulator
 * Access: ADMIN role
 */
router.post('/', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, TrainingSimulatorController.createSimulator);

/**
 * Update simulator (admin)
 * PUT /api/training-simulators/:id
 * Params: id
 * Body: Partial<TrainingSimulator>
 * Returns: TrainingSimulator
 * Access: ADMIN role
 */
router.put('/:id', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, TrainingSimulatorController.updateSimulator);

/**
 * Delete simulator (admin)
 * DELETE /api/training-simulators/:id
 * Params: id
 * Returns: null
 * Access: ADMIN role
 */
router.delete('/:id', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, TrainingSimulatorController.deleteSimulator);

/**
 * Reorder simulators (admin)
 * PUT /api/training-simulators/reorder
 * Body: { ids: string[] }
 * Access: ADMIN/SUPERADMIN role
 */
router.put('/reorder', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, TrainingSimulatorController.reorderSimulators);

export default router;
