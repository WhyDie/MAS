import { Router } from 'express';
import { EquipmentController } from '../controllers/EquipmentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/equipment/add
 * Add new equipment
 */
router.post('/add', authMiddleware, EquipmentController.addEquipment);

/**
 * GET /api/equipment/my
 * Get user's equipment
 */
router.get('/my', authMiddleware, EquipmentController.getUserEquipment);

/**
 * GET /api/equipment/type/:type
 * Get equipment by type (issued/personal/recommended)
 */
router.get('/type/:type', authMiddleware, EquipmentController.getByType);

/**
 * GET /api/equipment/category/:category
 * Get equipment by category
 */
router.get('/category/:category', authMiddleware, EquipmentController.getByCategory);

/**
 * GET /api/equipment/stats
 * Get equipment statistics
 */
router.get('/stats', authMiddleware, EquipmentController.getStats);

/**
 * GET /api/equipment/search
 * Search equipment
 */
router.get('/search', authMiddleware, EquipmentController.search);

/**
 * GET /api/equipment/recommendations
 * Get equipment recommendations
 */
router.get('/recommendations', authMiddleware, EquipmentController.getRecommendations);

/**
 * GET /api/equipment/weight
 * Get total equipment weight
 */
router.get('/weight', authMiddleware, EquipmentController.getTotalWeight);

/**
 * GET /api/equipment/cost
 * Get total equipment cost
 */
router.get('/cost', authMiddleware, EquipmentController.getTotalCost);

/**
 * GET /api/equipment/expiring
 * Check expiring equipment
 */
router.get('/expiring', authMiddleware, EquipmentController.checkExpiring);

/**
 * GET /api/equipment/categories
 * Get available categories
 */
router.get('/categories', authMiddleware, EquipmentController.getCategories);

/**
 * PUT /api/equipment/:id
 * Update equipment
 */
router.put('/:id', authMiddleware, EquipmentController.updateEquipment);

/**
 * DELETE /api/equipment/:id
 * Delete equipment
 */
router.delete('/:id', authMiddleware, EquipmentController.deleteEquipment);

export default router;
