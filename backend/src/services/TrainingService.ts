import { AppDataSource } from '../config/database';
import { TrainingModule } from '../models/TrainingModule';
import { UserProgress } from '../models/UserProgress';
import { User } from '../models/User';
import { PaginationParams } from '../types/index';

export class TrainingService {
  private moduleRepository = AppDataSource.getRepository(TrainingModule);
  private progressRepository = AppDataSource.getRepository(UserProgress);

  async getAllModules(params: Partial<PaginationParams> = {}): Promise<[TrainingModule[], number]> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    return this.moduleRepository.findAndCount({
      skip,
      take: limit,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async createModule(data: Partial<TrainingModule>): Promise<TrainingModule> {
    const module = this.moduleRepository.create(data);
    return this.moduleRepository.save(module);
  }

  async updateModule(id: string, data: Partial<TrainingModule>): Promise<TrainingModule | null> {
    await this.moduleRepository.update(id, data);
    return this.moduleRepository.findOne({ where: { id } });
  }

  async deleteModule(id: string): Promise<boolean> {
    const result = await this.moduleRepository.update(id, { isActive: false } as any);
    return (result.affected || 0) > 0;
  }

  async reorderModules(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.moduleRepository.update(ids[i], { sortOrder: i } as any);
    }
  }

  async getModulesByCategory(category: string, params: Partial<PaginationParams> = {}): Promise<[TrainingModule[], number]> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    return this.moduleRepository.findAndCount({
      skip,
      take: limit,
      where: { category, isOfflineAvailable: true },
      order: { difficulty: 'ASC', createdAt: 'DESC' },
    });
  }

  async getModuleById(id: string): Promise<TrainingModule | null> {
    const module = await this.moduleRepository.findOne({
      where: { id },
    });

    if (module) {
      module.viewCount += 1;
      await this.moduleRepository.save(module);
    }

    return module;
  }

  async getUserProgress(userId: string, moduleId: string): Promise<UserProgress | null> {
    return this.progressRepository.findOne({
      where: { userId, moduleId },
    });
  }

  async updateUserProgress(
    userId: string,
    moduleId: string,
    progress: Partial<UserProgress>
  ): Promise<UserProgress> {
    let userProgress = await this.progressRepository.findOne({
      where: { userId, moduleId },
    });

    if (!userProgress) {
      userProgress = new UserProgress();
      userProgress.userId = userId;
      userProgress.moduleId = moduleId;
    }

    Object.assign(userProgress, progress);

    if (userProgress.completionPercentage === 100) {
      userProgress.isCompleted = true;
      userProgress.completedAt = new Date();
    }

    return this.progressRepository.save(userProgress);
  }

  async getUserStats(userId: string): Promise<any> {
    const progress = await this.progressRepository.find({
      where: { userId },
    });

    const totalModules = await this.moduleRepository.count();
    const completedModules = progress.filter((p) => p.isCompleted).length;
    const inProgressModules = progress.filter((p) => !p.isCompleted && p.completionPercentage > 0).length;
    const averageScore =
      progress.length > 0
        ? Math.round(progress.reduce((sum, p) => sum + (p.score || 0), 0) / progress.length)
        : 0;

    return {
      totalModules,
      completedModules,
      completionRate: Math.round((completedModules / totalModules) * 100),
      inProgressModules,
      averageScore,
      lastActivityAt: progress.length > 0 ? progress[progress.length - 1].updatedAt : null,
    };
  }
}

export const trainingService = new TrainingService();
