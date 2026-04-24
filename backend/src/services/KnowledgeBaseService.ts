import { AppDataSource } from '../config/database';
import { KnowledgeBaseArticle, KnowledgeCategory, Difficulty } from '../models/KnowledgeBaseArticle';
import { Like, In } from 'typeorm';

export class KnowledgeBaseService {
  private articleRepository = AppDataSource.getRepository(KnowledgeBaseArticle);

  /**
   * Get all published articles with pagination
   */
  async getAllArticles(
    page: number = 1,
    limit: number = 20,
    category?: KnowledgeCategory,
    difficulty?: Difficulty
  ): Promise<{ articles: KnowledgeBaseArticle[]; total: number }> {
    const query = this.articleRepository
      .createQueryBuilder('article')
      .where('article.isPublished = :isPublished', { isPublished: true });

    if (category) {
      query.andWhere('article.category = :category', { category });
    }

    if (difficulty) {
      query.andWhere('article.difficulty = :difficulty', { difficulty });
    }

    const [articles, total] = await query
      .orderBy('article.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { articles, total };
  }

  /**
   * Get article by ID and increment view count
   */
  async getArticle(id: string): Promise<KnowledgeBaseArticle> {
    const article = await this.articleRepository.findOneOrFail({
      where: { id, isPublished: true }
    });

    // Increment view count
    article.viewCount++;
    await this.articleRepository.save(article);

    return article;
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(
    category: KnowledgeCategory,
    page: number = 1,
    limit: number = 20
  ): Promise<{ articles: KnowledgeBaseArticle[]; total: number }> {
    return this.getAllArticles(page, limit, category);
  }

  /**
   * Search articles by title or tags
   */
  async searchArticles(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ articles: KnowledgeBaseArticle[]; total: number }> {
    const [articles, total] = await this.articleRepository
      .createQueryBuilder('article')
      .where('article.isPublished = :isPublished', { isPublished: true })
      .andWhere(
        '(article.title ILIKE :query OR article.description ILIKE :query OR article.tags @> ARRAY[:query])',
        { query: `%${query}%` }
      )
      .orderBy('article.viewCount', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { articles, total };
  }

  /**
   * Get articles by tags
   */
  async getArticlesByTags(
    tags: string[],
    page: number = 1,
    limit: number = 20
  ): Promise<{ articles: KnowledgeBaseArticle[]; total: number }> {
    const [articles, total] = await this.articleRepository
      .createQueryBuilder('article')
      .where('article.isPublished = :isPublished', { isPublished: true })
      .andWhere('article.tags && :tags', { tags })
      .orderBy('article.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { articles, total };
  }

  /**
   * Get most viewed articles
   */
  async getPopularArticles(limit: number = 10): Promise<KnowledgeBaseArticle[]> {
    return await this.articleRepository
      .createQueryBuilder('article')
      .where('article.isPublished = :isPublished', { isPublished: true })
      .orderBy('article.viewCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get articles by difficulty level
   */
  async getArticlesByDifficulty(
    difficulty: Difficulty,
    page: number = 1,
    limit: number = 20
  ): Promise<{ articles: KnowledgeBaseArticle[]; total: number }> {
    return this.getAllArticles(page, limit, undefined, difficulty);
  }

  /**
   * Create new article (admin only)
   */
  async createArticle(articleData: Partial<KnowledgeBaseArticle>): Promise<KnowledgeBaseArticle> {
    const article = this.articleRepository.create(articleData);
    return await this.articleRepository.save(article);
  }

  /**
   * Update article (admin only)
   */
  async updateArticle(id: string, data: Partial<KnowledgeBaseArticle>): Promise<KnowledgeBaseArticle> {
    await this.articleRepository.update(id, data);
    return await this.articleRepository.findOneOrFail({ where: { id } });
  }

  /**
   * Delete article (admin only)
   */
  async deleteArticle(id: string): Promise<void> {
    await this.articleRepository.delete(id);
  }

  /**
   * Publish/unpublish article
   */
  async togglePublish(id: string): Promise<KnowledgeBaseArticle> {
    const article = await this.articleRepository.findOneOrFail({ where: { id } });
    article.isPublished = !article.isPublished;
    return await this.articleRepository.save(article);
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<Record<string, number>> {
    const categories = Object.values(KnowledgeCategory);
    const stats: Record<string, number> = {};

    for (const category of categories) {
      const count = await this.articleRepository.count({
        where: { category, isPublished: true }
      });
      stats[category] = count;
    }

    return stats;
  }

  /**
   * Get featured articles (most viewed + newest)
   */
  async getFeaturedArticles(): Promise<KnowledgeBaseArticle[]> {
    const [popular, newest] = await Promise.all([
      this.getPopularArticles(3),
      this.articleRepository
        .createQueryBuilder('article')
        .where('article.isPublished = :isPublished', { isPublished: true })
        .orderBy('article.createdAt', 'DESC')
        .limit(3)
        .getMany()
    ]);

    // Combine and deduplicate
    const featured = [...popular];
    for (const article of newest) {
      if (!featured.find(a => a.id === article.id)) {
        featured.push(article);
      }
    }

    return featured.slice(0, 6);
  }
}
