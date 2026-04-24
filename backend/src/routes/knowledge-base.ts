import { Router } from 'express';
import { KnowledgeBaseController } from '../controllers/KnowledgeBaseController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/knowledge-base/articles
 * Get all articles with pagination
 */
router.get('/articles', KnowledgeBaseController.getAllArticles);

/**
 * GET /api/knowledge-base/articles/:id
 * Get article by ID
 */
router.get('/articles/:id', KnowledgeBaseController.getArticle);

/**
 * GET /api/knowledge-base/category/:category
 * Get articles by category
 */
router.get('/category/:category', KnowledgeBaseController.getByCategory);

/**
 * GET /api/knowledge-base/difficulty/:difficulty
 * Get articles by difficulty
 */
router.get('/difficulty/:difficulty', KnowledgeBaseController.getByDifficulty);

/**
 * GET /api/knowledge-base/search
 * Search articles
 */
router.get('/search', KnowledgeBaseController.search);

/**
 * GET /api/knowledge-base/popular
 * Get popular articles
 */
router.get('/popular', KnowledgeBaseController.getPopular);

/**
 * GET /api/knowledge-base/featured
 * Get featured articles
 */
router.get('/featured', KnowledgeBaseController.getFeatured);

/**
 * GET /api/knowledge-base/stats/categories
 * Get category statistics
 */
router.get('/stats/categories', KnowledgeBaseController.getCategoryStats);

/**
 * POST /api/knowledge-base/articles
 * Create article (admin only)
 */
router.post(
  '/articles',
  authMiddleware,
  roleMiddleware('admin'),
  KnowledgeBaseController.createArticle
);

/**
 * PUT /api/knowledge-base/articles/:id
 * Update article (admin only)
 */
router.put(
  '/articles/:id',
  authMiddleware,
  roleMiddleware('admin'),
  KnowledgeBaseController.updateArticle
);

/**
 * DELETE /api/knowledge-base/articles/:id
 * Delete article (admin only)
 */
router.delete(
  '/articles/:id',
  authMiddleware,
  roleMiddleware('admin'),
  KnowledgeBaseController.deleteArticle
);

/**
 * PATCH /api/knowledge-base/articles/:id/publish
 * Toggle publish status (admin only)
 */
router.patch(
  '/articles/:id/publish',
  authMiddleware,
  roleMiddleware('admin'),
  KnowledgeBaseController.togglePublish
);

export default router;
