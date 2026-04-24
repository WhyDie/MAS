import { Request, Response } from 'express';
import { MentorshipService } from '../services/MentorshipService';
import { MentorshipTopic, MentorshipStatus } from '../models/MentorshipRequest';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

const mentorshipService = new MentorshipService();

export class MentorshipController {
  /**
   * Create mentorship request
   * POST /api/mentorship/requests
   */
  static async createRequest(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { topic, description, requiredSkills, isAnonymous } = req.body;

      if (!topic || !description) {
        return sendError(res, 'topic and description are required', 400);
      }

      const request = await mentorshipService.createRequest(
        userId,
        topic,
        description,
        requiredSkills,
        isAnonymous
      );

      sendSuccess(res, request, 'Request created successfully', 201);
    } catch (error) {
      console.error('Error creating request:', error);
      sendError(res, 'Error creating request', 500);
    }
  }

  /**
   * Get open mentorship requests
   * GET /api/mentorship/requests/open?page=1&limit=20&topic=
   */
  static async getOpenRequests(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, topic } = req.query;

      const result = await mentorshipService.getOpenRequests(
        parseInt(page as string),
        parseInt(limit as string),
        topic as MentorshipTopic
      );

      sendPaginated(res, result.requests, result.total, parseInt(page as string), parseInt(limit as string));
    } catch (error) {
      console.error('Error fetching open requests:', error);
      sendError(res, 'Error fetching open requests', 500);
    }
  }

  /**
   * Get mentor's requests
   * GET /api/mentorship/mentor/requests?status=
   */
  static async getMentorRequests(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { status } = req.query;

      const requests = await mentorshipService.getMentorRequests(
        userId,
        status as MentorshipStatus
      );

      sendSuccess(res, requests);
    } catch (error) {
      console.error('Error fetching mentor requests:', error);
      sendError(res, 'Error fetching mentor requests', 500);
    }
  }

  /**
   * Get recruit's requests
   * GET /api/mentorship/recruit/requests
   */
  static async getRecruitRequests(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const requests = await mentorshipService.getRecruitRequests(userId);
      sendSuccess(res, requests);
    } catch (error) {
      console.error('Error fetching recruit requests:', error);
      sendError(res, 'Error fetching recruit requests', 500);
    }
  }

  /**
   * Accept mentorship request
   * POST /api/mentorship/requests/:id/accept
   */
  static async acceptRequest(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const request = await mentorshipService.acceptRequest(id, userId);
      sendSuccess(res, request, 'Request accepted');
    } catch (error) {
      console.error('Error accepting request:', error);
      sendError(res, error instanceof Error ? error.message : 'Error accepting request', 500);
    }
  }

  /**
   * Respond to mentorship request
   * POST /api/mentorship/requests/:id/respond
   */
  static async respondToRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { response } = req.body;

      if (!response) {
        return sendError(res, 'response is required', 400);
      }

      const request = await mentorshipService.respondToRequest(id, response);
      sendSuccess(res, request, 'Response added');
    } catch (error) {
      console.error('Error responding to request:', error);
      sendError(res, 'Error responding to request', 500);
    }
  }

  /**
   * Complete mentorship
   * POST /api/mentorship/requests/:id/complete
   */
  static async completeRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const request = await mentorshipService.completeRequest(id);
      sendSuccess(res, request, 'Request completed');
    } catch (error) {
      console.error('Error completing request:', error);
      sendError(res, 'Error completing request', 500);
    }
  }

  /**
   * Cancel mentorship request
   * POST /api/mentorship/requests/:id/cancel
   */
  static async cancelRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const request = await mentorshipService.cancelRequest(id, reason);
      sendSuccess(res, request, 'Request cancelled');
    } catch (error) {
      console.error('Error cancelling request:', error);
      sendError(res, 'Error cancelling request', 500);
    }
  }

  /**
   * Add feedback to mentorship
   * POST /api/mentorship/requests/:id/feedback
   */
  static async addFeedback(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { mentorRating, recruiteRating, comments } = req.body;

      const request = await mentorshipService.addFeedback(
        id,
        mentorRating,
        recruiteRating,
        comments
      );

      sendSuccess(res, request, 'Feedback added');
    } catch (error) {
      console.error('Error adding feedback:', error);
      sendError(res, 'Error adding feedback', 500);
    }
  }

  /**
   * Get available mentors
   * GET /api/mentorship/mentors/available?topic=
   */
  static async getAvailableMentors(req: Request, res: Response) {
    try {
      const { topic } = req.query;

      const mentors = await mentorshipService.getAvailableMentors(topic as MentorshipTopic);
      sendSuccess(res, mentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      sendError(res, 'Error fetching mentors', 500);
    }
  }

  /**
   * Get my mentor statistics
   * GET /api/mentorship/mentor/stats
   */
  static async getMentorStats(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const stats = await mentorshipService.getMentorStatsAsync(userId);
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Error fetching mentor stats:', error);
      sendError(res, 'Error fetching mentor stats', 500);
    }
  }

  /**
   * Get mentor recommendation
   * GET /api/mentorship/recommend?topic=
   */
  static async getRecommendedMentor(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { topic } = req.query;

      if (!topic) {
        return sendError(res, 'topic is required', 400);
      }

      const mentor = await mentorshipService.recommendMentor(
        userId,
        topic as MentorshipTopic
      );

      if (!mentor) {
        return sendError(res, 'No mentors available for this topic', 404);
      }

      sendSuccess(res, mentor);
    } catch (error) {
      console.error('Error getting recommendation:', error);
      sendError(res, 'Error getting recommendation', 500);
    }
  }

  /**
   * Search mentors by skills
   * GET /api/mentorship/mentors/search?skills=skill1,skill2
   */
  static async searchMentors(req: Request, res: Response) {
    try {
      const { skills } = req.query;

      if (!skills) {
        return sendError(res, 'skills query parameter is required', 400);
      }

      const skillsList = (skills as string).split(',').map(s => s.trim());
      const mentors = await mentorshipService.searchMentorsBySkills(skillsList);

      sendSuccess(res, mentors);
    } catch (error) {
      console.error('Error searching mentors:', error);
      sendError(res, 'Error searching mentors', 500);
    }
  }
}
