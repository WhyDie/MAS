import { AppDataSource } from '../config/database';
import { PsychologicalSupport, SupportStatus, SupportSeverity } from '../models/PsychologicalSupport';
import { MoreThan, LessThan } from 'typeorm';

export class PsychologicalSupportService {
  private supportRepository = AppDataSource.getRepository(PsychologicalSupport);

  /**
   * Create support request
   */
  async createRequest(
    userId: string,
    message: string,
    contactType: 'anonymous' | 'identified',
    severity: SupportSeverity,
    keywords?: string[]
  ): Promise<PsychologicalSupport> {
    const request = this.supportRepository.create({
      userId,
      message,
      contactType,
      severity,
      keywords: keywords || [],
      status: SupportStatus.PENDING,
      isEscalated: severity === SupportSeverity.CRITICAL
    });

    return await this.supportRepository.save(request);
  }

  /**
   * Get user's support requests
   */
  async getUserRequests(
    userId: string,
    status?: SupportStatus
  ): Promise<PsychologicalSupport[]> {
    const query = this.supportRepository
      .createQueryBuilder('support')
      .where('support.userId = :userId', { userId });

    if (status) {
      query.andWhere('support.status = :status', { status });
    }

    return await query.orderBy('support.createdAt', 'DESC').getMany();
  }

  /**
   * Get all pending requests (for psychologist)
   */
  async getPendingRequests(limit: number = 20): Promise<PsychologicalSupport[]> {
    return await this.supportRepository
      .createQueryBuilder('support')
      .where('support.status = :status', { status: SupportStatus.PENDING })
      .orderBy('support.severity', 'DESC')
      .addOrderBy('support.createdAt', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get critical requests (immediate attention needed)
   */
  async getCriticalRequests(): Promise<PsychologicalSupport[]> {
    return await this.supportRepository
      .createQueryBuilder('support')
      .where('support.severity = :severity', { severity: SupportSeverity.CRITICAL })
      .andWhere('support.status IN (:...statuses)', {
        statuses: [SupportStatus.PENDING, SupportStatus.IN_PROGRESS]
      })
      .orderBy('support.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Respond to support request
   */
  async respondToRequest(
    requestId: string,
    response: string,
    psychologistId?: string
  ): Promise<PsychologicalSupport> {
    const request = await this.supportRepository.findOneOrFail({
      where: { id: requestId }
    });

    request.response = response;
    request.respondedAt = new Date();
    request.status = SupportStatus.RESPONDED;
    if (psychologistId) {
      request.respondedByUserId = psychologistId;
    }

    return await this.supportRepository.save(request);
  }

  /**
   * Escalate request
   */
  async escalateRequest(requestId: string, reason: string): Promise<PsychologicalSupport> {
    const request = await this.supportRepository.findOneOrFail({
      where: { id: requestId }
    });

    request.isEscalated = true;
    request.status = SupportStatus.ESCALATED;
    request.response = `Escalated: ${reason}`;

    return await this.supportRepository.save(request);
  }

  /**
   * Resolve request
   */
  async resolveRequest(requestId: string): Promise<PsychologicalSupport> {
    const request = await this.supportRepository.findOneOrFail({
      where: { id: requestId }
    });

    request.status = SupportStatus.RESOLVED;

    return await this.supportRepository.save(request);
  }

  /**
   * Get support statistics
   */
  async getSupportStats(): Promise<any> {
    const total = await this.supportRepository.count();
    const pending = await this.supportRepository.count({
      where: { status: SupportStatus.PENDING }
    });
    const critical = await this.supportRepository.count({
      where: { severity: SupportSeverity.CRITICAL }
    });
    const escalated = await this.supportRepository.count({
      where: { isEscalated: true }
    });

    const bySeverity = {
      low: await this.supportRepository.count({ where: { severity: SupportSeverity.LOW } }),
      medium: await this.supportRepository.count({ where: { severity: SupportSeverity.MEDIUM } }),
      high: await this.supportRepository.count({ where: { severity: SupportSeverity.HIGH } }),
      critical: await this.supportRepository.count({ where: { severity: SupportSeverity.CRITICAL } })
    };

    const byStatus = {
      pending: pending,
      inProgress: await this.supportRepository.count({ where: { status: SupportStatus.IN_PROGRESS } }),
      responded: await this.supportRepository.count({ where: { status: SupportStatus.RESPONDED } }),
      escalated,
      resolved: await this.supportRepository.count({ where: { status: SupportStatus.RESOLVED } })
    };

    return {
      total,
      bySeverity,
      byStatus,
      needsAttention: pending + critical
    };
  }

  /**
   * Get requests by severity
   */
  async getRequestsBySeverity(
    severity: SupportSeverity
  ): Promise<PsychologicalSupport[]> {
    return await this.supportRepository
      .createQueryBuilder('support')
      .where('support.severity = :severity', { severity })
      .orderBy('support.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get requests by keywords
   */
  async searchByKeywords(keywords: string[]): Promise<PsychologicalSupport[]> {
    if (keywords.length === 0) return [];

    const query = this.supportRepository
      .createQueryBuilder('support');

    keywords.forEach((keyword, index) => {
      query.orWhere(`support.keywords @> ARRAY[:keyword${index}]`, {
        [`keyword${index}`]: keyword
      });
    });

    return await query.getMany();
  }

  /**
   * Get anonymous requests (hide user details)
   */
  async getAnonymousRequests(limit: number = 10): Promise<any[]> {
    const requests = await this.supportRepository
      .createQueryBuilder('support')
      .where('support.contactType = :contactType', { contactType: 'anonymous' })
      .orderBy('support.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    // Return without userId
    return requests.map(req => ({
      ...req,
      userId: undefined
    }));
  }

  /**
   * Get support request by ID (with privacy checks)
   */
  async getRequest(id: string, userId?: string): Promise<Partial<PsychologicalSupport> | null> {
    const request = await this.supportRepository.findOne({ where: { id } });

    if (!request) return null;

    // If it's anonymous and requester is not the user or admin, hide details
    if (request.contactType === 'anonymous' && userId !== request.userId) {
      return {
        ...request,
        message: 'Анонімний запит'
      };
    }

    return request;
  }

  /**
   * Get audio recommendations for support
   */
  getAudioRecommendations(severity: SupportSeverity): any[] {
    const recommendations: { [key in SupportSeverity]: any[] } = {
      [SupportSeverity.LOW]: [
        { title: 'Релаксуюча медитація', duration: 10, type: 'meditation' },
        { title: 'Вправи для дихання', duration: 5, type: 'breathing' },
        { title: 'Позитивні афірмації', duration: 7, type: 'affirmation' }
      ],
      [SupportSeverity.MEDIUM]: [
        { title: 'Глибока релаксація', duration: 20, type: 'meditation' },
        { title: 'Вправи на розслаблення м\'язів', duration: 15, type: 'exercise' },
        { title: 'Сеанс гіпнотерапії', duration: 25, type: 'hypnotherapy' }
      ],
      [SupportSeverity.HIGH]: [
        { title: 'Крізус терапія', duration: 30, type: 'therapy' },
        { title: 'Контрольована дихальна вправа', duration: 10, type: 'breathing' },
        { title: 'Встановлення контакту з психологом', duration: 0, type: 'contact' }
      ],
      [SupportSeverity.CRITICAL]: [
        { title: 'Екстрена психологічна допомога', duration: 0, type: 'emergency' },
        { title: 'Гарячої лінія підтримки', duration: 0, type: 'hotline' },
        { title: 'Звернення до сподіваєтесь', duration: 0, type: 'emergency' }
      ]
    };

    return recommendations[severity] || recommendations[SupportSeverity.LOW];
  }

  /**
   * Log mood check-in
   */
  async logMoodCheckIn(userId: string, mood: number, notes?: string): Promise<any> {
    // This would typically be stored in a separate MoodLog entity
    return {
      userId,
      mood, // 1-10 scale
      notes,
      timestamp: new Date(),
      status: 'logged'
    };
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(userId: string, days: number = 30): Promise<any> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const requests = await this.supportRepository
      .createQueryBuilder('support')
      .where('support.userId = :userId', { userId })
      .andWhere('support.createdAt >= :sinceDate', { sinceDate })
      .getMany();

    const bySeverity = {
      low: requests.filter(r => r.severity === SupportSeverity.LOW).length,
      medium: requests.filter(r => r.severity === SupportSeverity.MEDIUM).length,
      high: requests.filter(r => r.severity === SupportSeverity.HIGH).length,
      critical: requests.filter(r => r.severity === SupportSeverity.CRITICAL).length
    };

    return {
      period: `${days} днів`,
      totalRequests: requests.length,
      severity: bySeverity,
      trend: requests.length > 0 ? '需要 посилення моніторингу' : 'Стабільно'
    };
  }
}
