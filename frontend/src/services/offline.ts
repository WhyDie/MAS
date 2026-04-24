import Dexie, { Table } from 'dexie';
import { TrainingModule, UserProgress, SyncData } from '../types/index';

export class LocalDatabase extends Dexie {
  modules!: Table<TrainingModule>;
  progress!: Table<UserProgress>;
  syncData!: Table<SyncData>;

  constructor() {
    super('MilitarySystemDB');
    this.version(1).stores({
      modules: '++id, category, createdAt',
      progress: '++id, userId, moduleId, completedAt',
      syncData: '++id, userId, dataType, lastSyncedAt',
    });
  }
}

export const db = new LocalDatabase();

export const offlineStorage = {
  // Модулі
  async saveModule(module: TrainingModule) {
    return db.modules.put(module);
  },

  async getModule(id: string) {
    return db.modules.get(id);
  },

  async getAllModules() {
    return db.modules.toArray();
  },

  async getModulesByCategory(category: string) {
    return db.modules.where('category').equals(category).toArray();
  },

  // Прогрес
  async saveProgress(progress: UserProgress) {
    return db.progress.put(progress);
  },

  async getProgress(userId: string, moduleId: string) {
    return db.progress
      .where('[userId+moduleId]')
      .equals([userId, moduleId])
      .first();
  },

  async getUserProgress(userId: string) {
    return db.progress.where('userId').equals(userId).toArray();
  },

  // Синхронізація
  async addSyncItem(item: SyncData) {
    return db.syncData.put(item);
  },

  async getPendingSyncItems(userId: string) {
    return db.syncData
      .where('userId')
      .equals(userId)
      .filter((item) => item.isPending)
      .toArray();
  },

  async markSyncItemSynced(id: string) {
    return db.syncData.update(id, {
      isPending: false,
      lastSyncedAt: new Date(),
    });
  },

  async clearOldData(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await db.modules
      .where('createdAt')
      .below(cutoffDate)
      .delete();

    await db.progress
      .where('completedAt')
      .below(cutoffDate)
      .delete();
  },
};
