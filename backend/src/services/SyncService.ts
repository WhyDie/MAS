import { AppDataSource } from '../config/database';
import { OfflineSyncData } from '../models/OfflineSyncData';
import { User } from '../models/User';

export class SyncService {
  private syncRepository = AppDataSource.getRepository(OfflineSyncData);
  private userRepository = AppDataSource.getRepository(User);

  async pushChanges(userId: string, changes: any[]): Promise<any> {
    const results = [];

    for (const change of changes) {
      try {
        const existing = await this.syncRepository.findOne({
          where: {
            userId,
            dataType: change.dataType,
            id: change.id,
          },
        });

        if (existing) {
          if (change.serverVersion < existing.serverVersion) {
            results.push({
              ...change,
              conflict: true,
              serverData: existing.data,
            });
            continue;
          }

          existing.data = change.data;
          existing.serverVersion = change.serverVersion + 1;
          existing.isPending = false;
          existing.lastSyncedAt = new Date();

          await this.syncRepository.save(existing);
        } else {
          const syncData = new OfflineSyncData();
          syncData.userId = userId;
          syncData.dataType = change.dataType;
          syncData.data = change.data;
          syncData.localVersion = change.localVersion || 1;
          syncData.serverVersion = 1;
          syncData.isPending = false;
          syncData.lastSyncedAt = new Date();

          await this.syncRepository.save(syncData);
        }

        results.push({ ...change, success: true });
      } catch (error) {
        results.push({ ...change, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return results;
  }

  async getPendingChanges(userId: string): Promise<OfflineSyncData[]> {
    return this.syncRepository.find({
      where: {
        userId,
        isPending: true,
      },
    });
  }

  async pullChanges(userId: string, since?: Date): Promise<any[]> {
    let query = this.syncRepository
      .createQueryBuilder('sync')
      .where('sync.userId = :userId', { userId })
      .andWhere('sync.isPending = false');

    if (since) {
      query = query.andWhere('sync.updatedAt > :since', { since });
    }

    return query.orderBy('sync.updatedAt', 'DESC').getMany();
  }

  async resolveConflict(syncId: string, resolution: 'local' | 'server' | 'merge', mergedData?: any): Promise<OfflineSyncData> {
    const syncData = await this.syncRepository.findOne({
      where: { id: syncId },
    });

    if (!syncData) {
      throw new Error('Sync data not found');
    }

    if (resolution === 'merge' && mergedData) {
      syncData.data = mergedData;
    }

    syncData.conflictedWith = [];
    await this.syncRepository.save(syncData);

    return syncData;
  }
}

export const syncService = new SyncService();
