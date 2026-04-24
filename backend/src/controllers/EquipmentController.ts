import { Request, Response } from 'express';
import { EquipmentService } from '../services/EquipmentService';
import { sendSuccess, sendError } from '../utils/response';

const equipmentService = new EquipmentService();

export class EquipmentController {
  /**
   * Add equipment for user
   * POST /api/equipment/add
   */
  static async addEquipment(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { name, type, category, weight, cost, purchaseDate, expiryDate, serialNumber } = req.body;

      if (!name || !type || !category) {
        return sendError(res, 'name, type, and category are required', 400);
      }

      const equipment = await equipmentService.addEquipment(
        userId,
        name,
        type,
        category,
        weight,
        cost,
        purchaseDate ? new Date(purchaseDate) : undefined,
        expiryDate ? new Date(expiryDate) : undefined,
        serialNumber
      );

      sendSuccess(res, equipment, 'Equipment added successfully', 201);
    } catch (error) {
      console.error('Error adding equipment:', error);
      sendError(res, 'Error adding equipment', 500);
    }
  }

  /**
   * Get user's equipment
   * GET /api/equipment/my
   */
  static async getUserEquipment(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const equipment = await equipmentService.getUserEquipment(userId);
      sendSuccess(res, equipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      sendError(res, 'Error fetching equipment', 500);
    }
  }

  /**
   * Get equipment by type
   * GET /api/equipment/type/:type
   */
  static async getByType(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { type } = req.params;

      if (!['issued', 'personal', 'recommended'].includes(type)) {
        return sendError(res, 'Invalid type', 400);
      }

      const equipment = await equipmentService.getEquipmentByType(
        userId,
        type as 'issued' | 'personal' | 'recommended'
      );

      sendSuccess(res, equipment);
    } catch (error) {
      console.error('Error fetching equipment by type:', error);
      sendError(res, 'Error fetching equipment', 500);
    }
  }

  /**
   * Get equipment by category
   * GET /api/equipment/category/:category
   */
  static async getByCategory(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { category } = req.params;

      const equipment = await equipmentService.getEquipmentByCategory(userId, category);
      sendSuccess(res, equipment);
    } catch (error) {
      console.error('Error fetching equipment by category:', error);
      sendError(res, 'Error fetching equipment', 500);
    }
  }

  /**
   * Update equipment
   * PUT /api/equipment/:id
   */
  static async updateEquipment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const equipment = await equipmentService.updateEquipment(id, data);
      sendSuccess(res, equipment, 'Equipment updated');
    } catch (error) {
      console.error('Error updating equipment:', error);
      sendError(res, 'Error updating equipment', 500);
    }
  }

  /**
   * Delete equipment
   * DELETE /api/equipment/:id
   */
  static async deleteEquipment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await equipmentService.deleteEquipment(id);
      sendSuccess(res, { id }, 'Equipment deleted');
    } catch (error) {
      console.error('Error deleting equipment:', error);
      sendError(res, 'Error deleting equipment', 500);
    }
  }

  /**
   * Get equipment statistics
   * GET /api/equipment/stats
   */
  static async getStats(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const stats = await equipmentService.getEquipmentStats(userId);
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      sendError(res, 'Error fetching stats', 500);
    }
  }

  /**
   * Search equipment
   * GET /api/equipment/search?q=
   */
  static async search(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { q } = req.query;

      if (!q) {
        return sendError(res, 'Search query is required', 400);
      }

      const equipment = await equipmentService.searchEquipment(userId, q as string);
      sendSuccess(res, equipment);
    } catch (error) {
      console.error('Error searching equipment:', error);
      sendError(res, 'Error searching equipment', 500);
    }
  }

  /**
   * Get equipment recommendations
   * GET /api/equipment/recommendations
   */
  static async getRecommendations(req: Request, res: Response) {
    try {
      const { specialization } = req.query;

      const recommendations = await equipmentService.getRecommendedEquipment(
        (specialization as string) || 'pikhota'
      );

      sendSuccess(res, { recommendations });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      sendError(res, 'Error fetching recommendations', 500);
    }
  }

  /**
   * Get total weight
   * GET /api/equipment/weight?type=
   */
  static async getTotalWeight(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { type } = req.query;

      const weight = await equipmentService.getTotalWeight(
        userId,
        type as 'issued' | 'personal' | 'recommended'
      );

      sendSuccess(res, { totalWeight: weight });
    } catch (error) {
      console.error('Error calculating weight:', error);
      sendError(res, 'Error calculating weight', 500);
    }
  }

  /**
   * Get total cost
   * GET /api/equipment/cost?type=
   */
  static async getTotalCost(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { type } = req.query;

      const cost = await equipmentService.getTotalCost(
        userId,
        type as 'issued' | 'personal' | 'recommended'
      );

      sendSuccess(res, { totalCost: cost });
    } catch (error) {
      console.error('Error calculating cost:', error);
      sendError(res, 'Error calculating cost', 500);
    }
  }

  /**
   * Check expiring equipment
   * GET /api/equipment/expiring
   */
  static async checkExpiring(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const expiring = await equipmentService.checkExpiringEquipment(userId);
      sendSuccess(res, { expiringItems: expiring, count: expiring.length });
    } catch (error) {
      console.error('Error checking expiring equipment:', error);
      sendError(res, 'Error checking expiring equipment', 500);
    }
  }

  /**
   * Get available categories
   * GET /api/equipment/categories
   */
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await equipmentService.getAvailableCategories();
      sendSuccess(res, { categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      sendError(res, 'Error fetching categories', 500);
    }
  }
}
