import { AppDataSource } from '../config/database';
import { TrainingSimulator, SimulatorAttempt, SimulatorType, SimulatorDifficulty } from '../models/TrainingSimulator';

export class TrainingSimulatorService {
  private get simulatorRepo() {
    return AppDataSource.getRepository(TrainingSimulator);
  }

  private get attemptRepo() {
    return AppDataSource.getRepository(SimulatorAttempt);
  }

  /**
   * Get all simulators with optional filtering
   */
  async getAllSimulators(
    category?: string,
    type?: SimulatorType,
    difficulty?: SimulatorDifficulty,
    limit = 20,
    offset = 0
  ) {
    const query = this.simulatorRepo.createQueryBuilder('sim')
      .where('sim.isActive = :isActive', { isActive: true });

    if (category) {
      query.andWhere('sim.category = :category', { category });
    }
    if (type) {
      query.andWhere('sim.type = :type', { type });
    }
    if (difficulty) {
      query.andWhere('sim.difficulty = :difficulty', { difficulty });
    }

    const [simulators, total] = await query
      .orderBy('sim.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return { simulators, total, page: Math.floor(offset / limit) + 1 };
  }

  /**
   * Get simulator by ID
   */
  async getSimulator(id: string) {
    return this.simulatorRepo.findOne({ where: { id } });
  }

  /**
   * Get simulators by category
   */
  async getSimulatorsByCategory(category: string, limit = 10) {
    return this.simulatorRepo.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get simulators by type
   */
  async getSimulatorsByType(type: SimulatorType, limit = 10) {
    return this.simulatorRepo.find({
      where: { type, isActive: true },
      order: { averageScore: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get simulators by difficulty
   */
  async getSimulatorsByDifficulty(difficulty: SimulatorDifficulty, limit = 10) {
    return this.simulatorRepo.find({
      where: { difficulty, isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Start a new simulator attempt
   */
  async startAttempt(userId: string, simulatorId: string) {
    const simulator = await this.getSimulator(simulatorId);
    if (!simulator) {
      throw new Error('Simulator not found');
    }

    const attempt = new SimulatorAttempt();
    attempt.userId = userId;
    attempt.simulatorId = simulatorId;
    attempt.status = 'in_progress';
    attempt.maxScore = simulator.scenarioFlow?.maxScore ||
      simulator.quizContent?.maxScore || 100;
    attempt.choices = {};
    attempt.stats = {
      health: 100,
      morale: 100,
      objective: 0,
      decisions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
    };

    return this.attemptRepo.save(attempt);
  }

  /**
   * Handle scenario choice in simulator
   */
  async handleScenarioChoice(
    attemptId: string,
    nodeId: string,
    choiceIndex: number
  ) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    const simulator = await this.getSimulator(attempt.simulatorId);
    if (!simulator || !simulator.scenarioFlow) {
      throw new Error('Simulator not found');
    }

    const node = simulator.scenarioFlow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error('Node not found');
    }

    const choice = node.choices[choiceIndex];
    if (!choice) {
      throw new Error('Invalid choice');
    }

    // Record choice
    if (!attempt.choices) {
      attempt.choices = {};
    }
    attempt.choices[nodeId] = choiceIndex;
    attempt.stats!.decisions = (attempt.stats!.decisions || 0) + 1;

    // Apply consequences
    if (choice.consequences) {
      if (choice.consequences.health) {
        attempt.stats!.health = Math.max(0, (attempt.stats!.health || 100) + choice.consequences.health);
      }
      if (choice.consequences.morale) {
        attempt.stats!.morale = Math.max(-100, Math.min(100, (attempt.stats!.morale || 100) + choice.consequences.morale));
      }
      if (choice.consequences.objective) {
        attempt.stats!.objective = Math.min(100, (attempt.stats!.objective || 0) + choice.consequences.objective);
      }

      // Add score
      attempt.score = (attempt.score || 0) + (choice.score || 0);
    }

    return this.attemptRepo.save(attempt);
  }

  /**
   * Handle quiz answer
   */
  async handleQuizAnswer(
    attemptId: string,
    questionId: string,
    answerIndex: number
  ) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    const simulator = await this.getSimulator(attempt.simulatorId);
    if (!simulator || !simulator.quizContent) {
      throw new Error('Simulator not found');
    }

    const question = simulator.quizContent.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // Record answer
    if (!attempt.choices) {
      attempt.choices = {};
    }
    attempt.choices[questionId] = answerIndex;

    // Check correctness
    const isCorrect = answerIndex === question.correctAnswer;
    if (isCorrect) {
      attempt.score = (attempt.score || 0) + question.score;
      attempt.stats!.correctAnswers = (attempt.stats!.correctAnswers || 0) + 1;
    } else {
      attempt.stats!.wrongAnswers = (attempt.stats!.wrongAnswers || 0) + 1;
    }

    return this.attemptRepo.save(attempt);
  }

  /**
   * Complete simulator attempt
   */
  async completeAttempt(attemptId: string) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    const simulator = await this.getSimulator(attempt.simulatorId);
    if (!simulator) {
      throw new Error('Simulator not found');
    }

    const passingScore = simulator.scenarioFlow?.passingScore ||
      simulator.quizContent?.passingScore || 70;

    attempt.status = 'completed';
    attempt.isCompleted = true;
    attempt.isPassed = attempt.score >= passingScore;
    attempt.completedAt = new Date();
    attempt.timeSpentSeconds = Math.floor(
      (new Date().getTime() - attempt.startedAt.getTime()) / 1000
    );

    // Update simulator stats
    simulator.completionCount = (simulator.completionCount || 0) + 1;
    const totalScore = simulator.averageScore * (simulator.completionCount - 1) + attempt.score;
    simulator.averageScore = totalScore / simulator.completionCount;

    const totalTimeSeconds = simulator.averageTimeMinutes * 60 * (simulator.completionCount - 1) +
      attempt.timeSpentSeconds;
    simulator.averageTimeMinutes = totalTimeSeconds / 60 / simulator.completionCount;

    await this.simulatorRepo.save(simulator);

    return this.attemptRepo.save(attempt);
  }

  /**
   * Abandon simulator attempt
   */
  async abandonAttempt(attemptId: string) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    attempt.status = 'abandoned';
    attempt.completedAt = new Date();

    return this.attemptRepo.save(attempt);
  }

  /**
   * Get user attempts for simulator
   */
  async getUserSimulatorAttempts(userId: string, simulatorId: string) {
    return this.attemptRepo.find({
      where: { userId, simulatorId },
      order: { startedAt: 'DESC' },
    });
  }

  /**
   * Get user's best attempt
   */
  async getUserBestAttempt(userId: string, simulatorId: string) {
    return this.attemptRepo.findOne({
      where: { userId, simulatorId, isCompleted: true },
      order: { score: 'DESC' },
    });
  }

  /**
   * Get user's all attempts across all simulators
   */
  async getUserAllAttempts(userId: string, limit = 50, offset = 0) {
    const [attempts, total] = await this.attemptRepo.findAndCount({
      where: { userId },
      order: { startedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { attempts, total };
  }

  /**
   * Get simulator leaderboard
   */
  async getSimulatorLeaderboard(simulatorId: string, limit = 10) {
    const attempts = await this.attemptRepo
      .createQueryBuilder('attempt')
      .where('attempt.simulatorId = :simulatorId', { simulatorId })
      .andWhere('attempt.isCompleted = :isCompleted', { isCompleted: true })
      .orderBy('attempt.score', 'DESC')
      .addOrderBy('attempt.timeSpentSeconds', 'ASC')
      .take(limit)
      .getMany();

    return attempts;
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string) {
    const attempts = await this.attemptRepo.find({
      where: { userId, isCompleted: true },
    });

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        completedAttempts: 0,
        passedAttempts: 0,
        averageScore: 0,
        totalTimeSpent: 0,
      };
    }

    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter(a => a.isPassed).length;
    const averageScore = attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts;
    const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0);

    return {
      totalAttempts,
      completedAttempts: totalAttempts,
      passedAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      totalTimeSpent,
    };
  }

  /**
   * Create simulator (admin function)
   */
  async createSimulator(data: Partial<TrainingSimulator>) {
    const simulator = this.simulatorRepo.create(data);
    return this.simulatorRepo.save(simulator);
  }

  /**
   * Update simulator (admin function)
   */
  async updateSimulator(id: string, data: Partial<TrainingSimulator>) {
    await this.simulatorRepo.update(id, data);
    return this.getSimulator(id);
  }

  /**
   * Delete simulator (admin function)
   */
  async deleteSimulator(id: string) {
    return this.simulatorRepo.delete(id);
  }

  /**
   * Get categories
   */
  async getCategories() {
    const simulators = await this.simulatorRepo
      .createQueryBuilder('sim')
      .select('DISTINCT sim.category', 'category')
      .where('sim.isActive = :isActive', { isActive: true })
      .getRawMany();

    return simulators.map(s => s.category);
  }

  /**
   * Search simulators
   */
  async searchSimulators(query: string, limit = 20) {
    return this.simulatorRepo
      .createQueryBuilder('sim')
      .where('sim.isActive = :isActive', { isActive: true })
      .andWhere('(sim.title ILIKE :query OR sim.description ILIKE :query OR sim.tags @> :tags)', {
        query: `%${query}%`,
        tags: [query],
      })
      .orderBy('sim.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Get recommended simulators for user
   */
  async getRecommendedSimulators(userId: string, limit = 5) {
    const userAttempts = await this.attemptRepo.find({
      where: { userId, isCompleted: true },
    });

    if (userAttempts.length === 0) {
      return this.getAllSimulators(undefined, undefined, SimulatorDifficulty.easy, limit);
    }

    // Get simulators user hasn't completed yet
    const completedIds = [...new Set(userAttempts.map(a => a.simulatorId))];

    const recommended = await this.simulatorRepo
      .createQueryBuilder('sim')
      .where('sim.isActive = :isActive', { isActive: true })
      .andWhere('sim.id NOT IN (:...completedIds)', { completedIds })
      .orderBy('sim.averageScore', 'DESC')
      .addOrderBy('sim.completionCount', 'DESC')
      .take(limit)
      .getMany();

    return recommended;
  }

  async reorderSimulators(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.simulatorRepo.update(ids[i], { sortOrder: i } as any);
    }
  }
}
