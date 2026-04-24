import { Request, Response } from 'express';
import { PsychologicalSupportService } from '../services/PsychologicalSupportService';
import { SupportSeverity, SupportStatus } from '../models/PsychologicalSupport';
import { sendSuccess, sendError } from '../utils/response';

const supportService = new PsychologicalSupportService();

export class PsychologicalSupportController {
  /**
   * Create support request
   * POST /api/psychological-support/request
   */
  static async createRequest(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { message, contactType, severity, keywords } = req.body;

      if (!message || !severity) {
        return sendError(res, 'message and severity are required', 400);
      }

      if (!Object.values(SupportSeverity).includes(severity)) {
        return sendError(res, 'Invalid severity level', 400);
      }

      const request = await supportService.createRequest(
        userId,
        message,
        contactType || 'identified',
        severity,
        keywords
      );

      sendSuccess(res, request, 'Support request created', 201);
    } catch (error) {
      console.error('Error creating support request:', error);
      sendError(res, 'Error creating support request', 500);
    }
  }

  /**
   * Get my support requests
   * GET /api/psychological-support/my-requests?status=
   */
  static async getUserRequests(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { status } = req.query;

      const requests = await supportService.getUserRequests(
        userId,
        status as SupportStatus
      );

      sendSuccess(res, requests);
    } catch (error) {
      console.error('Error fetching user requests:', error);
      sendError(res, 'Error fetching user requests', 500);
    }
  }

  /**
   * Get pending requests (psychologist only)
   * GET /api/psychological-support/pending
   */
  static async getPendingRequests(req: Request, res: Response) {
    try {
      const { limit = 20 } = req.query;

      const requests = await supportService.getPendingRequests(parseInt(limit as string));
      sendSuccess(res, requests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      sendError(res, 'Error fetching pending requests', 500);
    }
  }

  /**
   * Get critical requests
   * GET /api/psychological-support/critical
   */
  static async getCriticalRequests(req: Request, res: Response) {
    try {
      const requests = await supportService.getCriticalRequests();
      sendSuccess(res, requests);
    } catch (error) {
      console.error('Error fetching critical requests:', error);
      sendError(res, 'Error fetching critical requests', 500);
    }
  }

  /**
   * Respond to support request
   * POST /api/psychological-support/:id/respond
   */
  static async respondToRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { response } = req.body;
      const psychologistId = req.user!.userId;

      if (!response) {
        return sendError(res, 'response is required', 400);
      }

      const updated = await supportService.respondToRequest(
        id,
        response,
        psychologistId
      );

      sendSuccess(res, updated, 'Response added');
    } catch (error) {
      console.error('Error responding to request:', error);
      sendError(res, 'Error responding to request', 500);
    }
  }

  /**
   * Escalate support request
   * POST /api/psychological-support/:id/escalate
   */
  static async escalateRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return sendError(res, 'reason is required', 400);
      }

      const updated = await supportService.escalateRequest(id, reason);
      sendSuccess(res, updated, 'Request escalated');
    } catch (error) {
      console.error('Error escalating request:', error);
      sendError(res, 'Error escalating request', 500);
    }
  }

  /**
   * Resolve support request
   * POST /api/psychological-support/:id/resolve
   */
  static async resolveRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const updated = await supportService.resolveRequest(id);
      sendSuccess(res, updated, 'Request resolved');
    } catch (error) {
      console.error('Error resolving request:', error);
      sendError(res, 'Error resolving request', 500);
    }
  }

  /**
   * Get support statistics
   * GET /api/psychological-support/stats
   */
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await supportService.getSupportStats();
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      sendError(res, 'Error fetching stats', 500);
    }
  }

  /**
   * Get requests by severity
   * GET /api/psychological-support/severity/:severity
   */
  static async getRequestsBySeverity(req: Request, res: Response) {
    try {
      const { severity } = req.params;

      if (!Object.values(SupportSeverity).includes(severity as SupportSeverity)) {
        return sendError(res, 'Invalid severity', 400);
      }

      const requests = await supportService.getRequestsBySeverity(severity as SupportSeverity);
      sendSuccess(res, requests);
    } catch (error) {
      console.error('Error fetching requests by severity:', error);
      sendError(res, 'Error fetching requests', 500);
    }
  }

  /**
   * Search by keywords
   * GET /api/psychological-support/search?keywords=keyword1,keyword2
   */
  static async searchByKeywords(req: Request, res: Response) {
    try {
      const { keywords } = req.query;

      if (!keywords) {
        return sendError(res, 'keywords are required', 400);
      }

      const keywordList = (keywords as string).split(',').map(k => k.trim());
      const requests = await supportService.searchByKeywords(keywordList);

      sendSuccess(res, requests);
    } catch (error) {
      console.error('Error searching requests:', error);
      sendError(res, 'Error searching requests', 500);
    }
  }

  /**
   * Get audio recommendations
   * GET /api/psychological-support/audio?severity=
   */
  static async getAudioRecommendations(req: Request, res: Response) {
    try {
      const { severity = SupportSeverity.LOW } = req.query;

      if (!Object.values(SupportSeverity).includes(severity as SupportSeverity)) {
        return sendError(res, 'Invalid severity', 400);
      }

      const recommendations = supportService.getAudioRecommendations(
        severity as SupportSeverity
      );

      sendSuccess(res, { audioTracks: recommendations });
    } catch (error) {
      console.error('Error fetching audio recommendations:', error);
      sendError(res, 'Error fetching audio recommendations', 500);
    }
  }

  /**
   * Log mood check-in
   * POST /api/psychological-support/mood
   */
  static async logMood(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { mood, notes } = req.body;

      if (mood === undefined || mood < 1 || mood > 10) {
        return sendError(res, 'mood must be between 1 and 10', 400);
      }

      const result = await supportService.logMoodCheckIn(userId, mood, notes);
      sendSuccess(res, result, 'Mood logged', 201);
    } catch (error) {
      console.error('Error logging mood:', error);
      sendError(res, 'Error logging mood', 500);
    }
  }

  /**
   * Get trend analysis
   * GET /api/psychological-support/trends?days=30
   */
  static async getTrendAnalysis(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { days = 30 } = req.query;

      const trends = await supportService.getTrendAnalysis(userId, parseInt(days as string));
      sendSuccess(res, trends);
    } catch (error) {
      console.error('Error fetching trends:', error);
      sendError(res, 'Error fetching trends', 500);
    }
  }

  /**
   * Get anonymous requests (psychologist)
   * GET /api/psychological-support/anonymous
   */
  static async getAnonymousRequests(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const requests = await supportService.getAnonymousRequests(parseInt(limit as string));
      sendSuccess(res, requests);
    } catch (error) {
      console.error('Error fetching anonymous requests:', error);
      sendError(res, 'Error fetching anonymous requests', 500);
    }
  }

  /**
   * Get single request (with privacy checks)
   * GET /api/psychological-support/:id
   */
  static async getRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const request = await supportService.getRequest(id, userId);

      if (!request) {
        return sendError(res, 'Request not found', 404);
      }

      sendSuccess(res, request);
    } catch (error) {
      console.error('Error fetching request:', error);
      sendError(res, 'Error fetching request', 500);
    }
  }
}
