import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { syncService } from '../services/SyncService';

export class SyncController {
  async pushChanges(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const { changes } = req.body;

      if (!Array.isArray(changes)) {
        sendError(res, 'Changes must be an array', 400);
        return;
      }

      const results = await syncService.pushChanges(req.user.userId, changes);

      sendSuccess(res, { results }, 'Changes synced', 200);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Sync failed', 500);
    }
  }

  async pullChanges(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const since = req.query.since ? new Date(req.query.since as string) : undefined;

      const changes = await syncService.pullChanges(req.user.userId, since);

      sendSuccess(res, { changes });
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Pull failed', 500);
    }
  }

  async getPendingChanges(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const pending = await syncService.getPendingChanges(req.user.userId);

      sendSuccess(res, { pending });
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch pending', 500);
    }
  }

  async resolveConflict(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const { syncId } = req.params;
      const { resolution, mergedData } = req.body;

      const result = await syncService.resolveConflict(syncId, resolution, mergedData);

      sendSuccess(res, result, 'Conflict resolved', 200);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Resolution failed', 500);
    }
  }
}

export const syncController = new SyncController();
