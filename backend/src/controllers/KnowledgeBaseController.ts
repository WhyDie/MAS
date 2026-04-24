import { Request, Response } from 'express';
import { KnowledgeBaseService } from '../services/KnowledgeBaseService';
import { KnowledgeCategory, Difficulty } from '../models/KnowledgeBaseArticle';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

const kbService = new KnowledgeBaseService();

export class KnowledgeBaseController {
  /**
   * Get all articles with pagination
   * GET /api/knowledge-base/articles?page=1&limit=20&category=&difficulty=
   */
  static async getAllArticles(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, category, difficulty } = req.query;

      const result = await kbService.getAllArticles(
        parseInt(page as string),
        parseInt(limit as string),
        category as KnowledgeCategory,
        difficulty as Difficulty
      );

      sendPaginated(res, result.articles, result.total, parseInt(page as string), parseInt(limit as string));
    } catch (error) {
      console.error('Error fetching articles:', error);
      sendError(res, 'Error fetching articles', 500);
    }
  }

  /**
   * Get article by ID
   * GET /api/knowledge-base/articles/:id
   */
  static async getArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const article = await kbService.getArticle(id);
      sendSuccess(res, article);
    } catch (error) {
      console.error('Error fetching article:', error);
      sendError(res, 'Article not found', 404);
    }
  }

  /**
   * Get articles by category
   * GET /api/knowledge-base/category/:category?page=1&limit=20
   */
  static async getByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!Object.values(KnowledgeCategory).includes(category as KnowledgeCategory)) {
        return sendError(res, 'Invalid category', 400);
      }

      const result = await kbService.getArticlesByCategory(
        category as KnowledgeCategory,
        parseInt(page as string),
        parseInt(limit as string)
      );

      sendPaginated(res, result.articles, result.total, parseInt(page as string), parseInt(limit as string));
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      sendError(res, 'Error fetching articles', 500);
    }
  }

  /**
   * Search articles
   * GET /api/knowledge-base/search?query=&page=1&limit=20
   */
  static async search(req: Request, res: Response) {
    try {
      const { query, page = 1, limit = 20 } = req.query;

      if (!query) {
        return sendError(res, 'Search query is required', 400);
      }

      const result = await kbService.searchArticles(
        query as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      sendPaginated(res, result.articles, result.total, parseInt(page as string), parseInt(limit as string));
    } catch (error) {
      console.error('Error searching articles:', error);
      sendError(res, 'Error searching articles', 500);
    }
  }

  /**
   * Get popular articles
   * GET /api/knowledge-base/popular?limit=10
   */
  static async getPopular(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const articles = await kbService.getPopularArticles(parseInt(limit as string));
      sendSuccess(res, articles);
    } catch (error) {
      console.error('Error fetching popular articles:', error);
      sendError(res, 'Error fetching popular articles', 500);
    }
  }

  /**
   * Get featured articles
   * GET /api/knowledge-base/featured
   */
  static async getFeatured(req: Request, res: Response) {
    try {
      const articles = await kbService.getFeaturedArticles();
      sendSuccess(res, articles);
    } catch (error) {
      console.error('Error fetching featured articles:', error);
      sendError(res, 'Error fetching featured articles', 500);
    }
  }

  /**
   * Get category statistics
   * GET /api/knowledge-base/stats/categories
   */
  static async getCategoryStats(req: Request, res: Response) {
    try {
      const stats = await kbService.getCategoryStats();
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Error fetching category stats:', error);
      sendError(res, 'Error fetching category stats', 500);
    }
  }

  /**
   * Create article (admin only)
   * POST /api/knowledge-base/articles
   */
  static async createArticle(req: Request, res: Response) {
    try {
      const articleData = req.body;

      if (!articleData.title || !articleData.content || !articleData.category) {
        return sendError(res, 'title, content, and category are required', 400);
      }

      const article = await kbService.createArticle(articleData);
      sendSuccess(res, article, 'Article created successfully', 201);
    } catch (error) {
      console.error('Error creating article:', error);
      sendError(res, 'Error creating article', 500);
    }
  }

  /**
   * Update article (admin only)
   * PUT /api/knowledge-base/articles/:id
   */
  static async updateArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const articleData = req.body;

      const article = await kbService.updateArticle(id, articleData);
      sendSuccess(res, article, 'Article updated successfully');
    } catch (error) {
      console.error('Error updating article:', error);
      sendError(res, 'Error updating article', 500);
    }
  }

  /**
   * Delete article (admin only)
   * DELETE /api/knowledge-base/articles/:id
   */
  static async deleteArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await kbService.deleteArticle(id);
      sendSuccess(res, { id }, 'Article deleted successfully');
    } catch (error) {
      console.error('Error deleting article:', error);
      sendError(res, 'Error deleting article', 500);
    }
  }

  /**
   * Toggle article publish status
   * PATCH /api/knowledge-base/articles/:id/publish
   */
  static async togglePublish(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const article = await kbService.togglePublish(id);
      sendSuccess(res, article, 'Article publish status updated');
    } catch (error) {
      console.error('Error toggling publish status:', error);
      sendError(res, 'Error toggling publish status', 500);
    }
  }

  /**
   * Get articles by difficulty
   * GET /api/knowledge-base/difficulty/:difficulty?page=1&limit=20
   */
  static async getByDifficulty(req: Request, res: Response) {
    try {
      const { difficulty } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!Object.values(Difficulty).includes(difficulty as Difficulty)) {
        return sendError(res, 'Invalid difficulty', 400);
      }

      const result = await kbService.getArticlesByDifficulty(
        difficulty as Difficulty,
        parseInt(page as string),
        parseInt(limit as string)
      );

      sendPaginated(res, result.articles, result.total, parseInt(page as string), parseInt(limit as string));
    } catch (error) {
      console.error('Error fetching articles by difficulty:', error);
      sendError(res, 'Error fetching articles', 500);
    }
  }
}
