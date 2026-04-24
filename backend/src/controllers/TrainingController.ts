import { Request, Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { trainingService } from '../services/TrainingService';

export class TrainingController {
  async getAllModules(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;

      let modules, total;

      if (category) {
        [modules, total] = await trainingService.getModulesByCategory(category, { page, limit });
      } else {
        [modules, total] = await trainingService.getAllModules({ page, limit });
      }

      sendPaginated(res, modules, total, page, limit);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch modules', 500);
    }
  }

  async getModuleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const module = await trainingService.getModuleById(id);

      if (!module) {
        sendError(res, 'Module not found', 404);
        return;
      }

      sendSuccess(res, module);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch module', 500);
    }
  }

  async getUserProgress(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const { moduleId } = req.params;

      const progress = await trainingService.getUserProgress(req.user.userId, moduleId);

      sendSuccess(res, progress || { moduleId, completionPercentage: 0, isCompleted: false });
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch progress', 500);
    }
  }

  async updateUserProgress(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const { moduleId } = req.params;

      const progress = await trainingService.updateUserProgress(
        req.user.userId,
        moduleId,
        req.body
      );

      sendSuccess(res, progress, 'Progress updated', 200);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to update progress', 500);
    }
  }

  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const stats = await trainingService.getUserStats(req.user.userId);

      sendSuccess(res, stats);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch stats', 500);
    }
  }

  async createModule(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
      if (!['commander', 'admin', 'superadmin'].includes(req.user.role)) { sendError(res, 'Insufficient permissions', 403); return; }
      const module = await trainingService.createModule(req.body);
      sendSuccess(res, module, 'Module created successfully', 201);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to create module', 400);
    }
  }

  async updateModule(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
      if (!['commander', 'admin', 'superadmin'].includes(req.user.role)) { sendError(res, 'Insufficient permissions', 403); return; }
      const module = await trainingService.updateModule(req.params.id, req.body);
      if (!module) { sendError(res, 'Module not found', 404); return; }
      sendSuccess(res, module, 'Module updated successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to update module', 400);
    }
  }

  async deleteModule(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
      if (!['commander', 'admin', 'superadmin'].includes(req.user.role)) { sendError(res, 'Insufficient permissions', 403); return; }
      const success = await trainingService.deleteModule(req.params.id);
      if (!success) { sendError(res, 'Module not found', 404); return; }
      sendSuccess(res, { id: req.params.id }, 'Module deleted successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to delete module', 400);
    }
  }

  async reorderModules(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Unauthorized', 401); return; }
      if (!['commander', 'admin', 'superadmin'].includes(req.user.role)) { sendError(res, 'Insufficient permissions', 403); return; }
      const { ids }: { ids: string[] } = req.body;
      if (!Array.isArray(ids)) { sendError(res, 'ids must be an array', 400); return; }
      await trainingService.reorderModules(ids);
      sendSuccess(res, { ids }, 'Modules reordered successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to reorder modules', 400);
    }
  }
}

export const trainingController = new TrainingController();
