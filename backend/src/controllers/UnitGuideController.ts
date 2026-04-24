import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { unitGuideService } from '../services/UnitGuideService';

function isAdmin(req: Request, res: Response): boolean {
  if (!req.user) { sendError(res, 'Unauthorized', 401); return false; }
  if (!['commander', 'admin', 'superadmin'].includes(req.user.role)) {
    sendError(res, 'Insufficient permissions', 403);
    return false;
  }
  return true;
}

export class UnitGuideController {
  // ===== ROOMS =====

  async getAllRooms(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      const rooms = await unitGuideService.getAllRooms(category as string);
      sendSuccess(res, rooms);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch rooms', 500);
    }
  }

  async getRoomById(req: Request, res: Response): Promise<void> {
    try {
      const room = await unitGuideService.getRoomById(req.params.id);
      if (!room) { sendError(res, 'Room not found', 404); return; }
      sendSuccess(res, room);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch room', 500);
    }
  }

  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const room = await unitGuideService.createRoom(req.body);
      sendSuccess(res, room, 'Room created successfully', 201);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to create room', 400);
    }
  }

  async updateRoom(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const room = await unitGuideService.updateRoom(req.params.id, req.body);
      if (!room) { sendError(res, 'Room not found', 404); return; }
      sendSuccess(res, room, 'Room updated successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to update room', 400);
    }
  }

  async deleteRoom(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const success = await unitGuideService.deleteRoom(req.params.id);
      if (!success) { sendError(res, 'Room not found', 404); return; }
      sendSuccess(res, { id: req.params.id }, 'Room deleted successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to delete room', 400);
    }
  }

  async reorderRooms(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const { ids }: { ids: string[] } = req.body;
      if (!Array.isArray(ids)) { sendError(res, 'ids must be an array', 400); return; }
      await unitGuideService.reorderRooms(ids);
      sendSuccess(res, { ids }, 'Rooms reordered successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to reorder rooms', 400);
    }
  }

  // ===== STAFF =====

  async getAllStaff(req: Request, res: Response): Promise<void> {
    try {
      const staff = await unitGuideService.getAllStaff();
      sendSuccess(res, staff);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch staff', 500);
    }
  }

  async getStaffById(req: Request, res: Response): Promise<void> {
    try {
      const staff = await unitGuideService.getStaffById(req.params.id);
      if (!staff) { sendError(res, 'Staff member not found', 404); return; }
      sendSuccess(res, staff);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch staff member', 500);
    }
  }

  async createStaff(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const staff = await unitGuideService.createStaff(req.body);
      sendSuccess(res, staff, 'Staff member created successfully', 201);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to create staff member', 400);
    }
  }

  async updateStaff(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const staff = await unitGuideService.updateStaff(req.params.id, req.body);
      if (!staff) { sendError(res, 'Staff member not found', 404); return; }
      sendSuccess(res, staff, 'Staff member updated successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to update staff member', 400);
    }
  }

  async deleteStaff(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const success = await unitGuideService.deleteStaff(req.params.id);
      if (!success) { sendError(res, 'Staff member not found', 404); return; }
      sendSuccess(res, { id: req.params.id }, 'Staff member deleted successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to delete staff member', 400);
    }
  }

  async reorderStaff(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const { ids }: { ids: string[] } = req.body;
      if (!Array.isArray(ids)) { sendError(res, 'ids must be an array', 400); return; }
      await unitGuideService.reorderStaff(ids);
      sendSuccess(res, { ids }, 'Staff reordered successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to reorder staff', 400);
    }
  }

  // ===== ARRIVAL STEPS =====

  async getAllSteps(req: Request, res: Response): Promise<void> {
    try {
      const steps = await unitGuideService.getAllSteps();
      sendSuccess(res, steps);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch steps', 500);
    }
  }

  async getStepById(req: Request, res: Response): Promise<void> {
    try {
      const step = await unitGuideService.getStepById(req.params.id);
      if (!step) { sendError(res, 'Step not found', 404); return; }
      sendSuccess(res, step);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch step', 500);
    }
  }

  async createStep(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const step = await unitGuideService.createStep(req.body);
      sendSuccess(res, step, 'Step created successfully', 201);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to create step', 400);
    }
  }

  async updateStep(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const step = await unitGuideService.updateStep(req.params.id, req.body);
      if (!step) { sendError(res, 'Step not found', 404); return; }
      sendSuccess(res, step, 'Step updated successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to update step', 400);
    }
  }

  async deleteStep(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const success = await unitGuideService.deleteStep(req.params.id);
      if (!success) { sendError(res, 'Step not found', 404); return; }
      sendSuccess(res, { id: req.params.id }, 'Step deleted successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to delete step', 400);
    }
  }

  async reorderSteps(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const { ids }: { ids: string[] } = req.body;
      if (!Array.isArray(ids)) { sendError(res, 'ids must be an array', 400); return; }
      await unitGuideService.reorderSteps(ids);
      sendSuccess(res, { ids }, 'Steps reordered successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to reorder steps', 400);
    }
  }

  // ===== MILITARY RESOURCES =====

  async getAllResources(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      const resources = await unitGuideService.getAllResources(category as string);
      sendSuccess(res, resources);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch resources', 500);
    }
  }

  async getResourceById(req: Request, res: Response): Promise<void> {
    try {
      const resource = await unitGuideService.getResourceById(req.params.id);
      if (!resource) { sendError(res, 'Resource not found', 404); return; }
      sendSuccess(res, resource);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch resource', 500);
    }
  }

  async createResource(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const resource = await unitGuideService.createResource(req.body);
      sendSuccess(res, resource, 'Resource created successfully', 201);
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to create resource', 400);
    }
  }

  async updateResource(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const resource = await unitGuideService.updateResource(req.params.id, req.body);
      if (!resource) { sendError(res, 'Resource not found', 404); return; }
      sendSuccess(res, resource, 'Resource updated successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to update resource', 400);
    }
  }

  async deleteResource(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const success = await unitGuideService.deleteResource(req.params.id);
      if (!success) { sendError(res, 'Resource not found', 404); return; }
      sendSuccess(res, { id: req.params.id }, 'Resource deleted successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to delete resource', 400);
    }
  }

  async reorderResources(req: Request, res: Response): Promise<void> {
    try {
      if (!isAdmin(req, res)) return;
      const { ids }: { ids: string[] } = req.body;
      if (!Array.isArray(ids)) { sendError(res, 'ids must be an array', 400); return; }
      await unitGuideService.reorderResources(ids);
      sendSuccess(res, { ids }, 'Resources reordered successfully');
    } catch (error) {
      sendError(res, error instanceof Error ? error.message : 'Failed to reorder resources', 400);
    }
  }
}

export const unitGuideController = new UnitGuideController();
