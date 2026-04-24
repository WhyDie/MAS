import { Request, Response } from 'express';
import { ScheduleService } from '../services/ScheduleService';
import { EventType, EventStatus } from '../models/ScheduleEvent';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

const scheduleService = new ScheduleService();

export class ScheduleController {
  /**
   * Get schedule events for date range
   * GET /api/schedule/events?startDate=&endDate=&unitId=
   */
  static async getEvents(req: Request, res: Response) {
    try {
      const { startDate, endDate, unitId } = req.query;

      if (!startDate || !endDate) {
        return sendError(res, 'startDate and endDate are required', 400);
      }

      const events = await scheduleService.getEventsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string),
        unitId as string
      );

      sendSuccess(res, events);
    } catch (error) {
      console.error('Error fetching events:', error);
      sendError(res, 'Error fetching events', 500);
    }
  }

  /**
   * Get user's daily schedule
   * GET /api/schedule/user/:userId/date/:date
   */
  static async getUserDailySchedule(req: Request, res: Response) {
    try {
      const { userId, date } = req.params;

      const events = await scheduleService.getUserEventsForDate(
        userId,
        new Date(date)
      );

      sendSuccess(res, events);
    } catch (error) {
      console.error('Error fetching user schedule:', error);
      sendError(res, 'Error fetching user schedule', 500);
    }
  }

  /**
   * Get week schedule
   * GET /api/schedule/unit/:unitId/week?startDate=
   */
  static async getWeekSchedule(req: Request, res: Response) {
    try {
      const { unitId } = req.params;
      const { startDate } = req.query;

      if (!startDate) {
        return sendError(res, 'startDate is required', 400);
      }

      const events = await scheduleService.getWeekSchedule(
        unitId,
        new Date(startDate as string)
      );

      sendSuccess(res, events);
    } catch (error) {
      console.error('Error fetching week schedule:', error);
      sendError(res, 'Error fetching week schedule', 500);
    }
  }

  /**
   * Get upcoming events
   * GET /api/schedule/unit/:unitId/upcoming?limit=10
   */
  static async getUpcomingEvents(req: Request, res: Response) {
    try {
      const { unitId } = req.params;
      const { limit } = req.query;

      const events = await scheduleService.getUpcomingEvents(
        unitId,
        parseInt(limit as string) || 10
      );

      sendSuccess(res, events);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      sendError(res, 'Error fetching upcoming events', 500);
    }
  }

  /**
   * Create new event
   * POST /api/schedule/events
   */
  static async createEvent(req: Request, res: Response) {
    try {
      const eventData = req.body;

      if (!eventData.title || !eventData.startTime || !eventData.endTime) {
        return sendError(res, 'title, startTime, and endTime are required', 400);
      }

      const event = await scheduleService.createEvent(eventData);
      sendSuccess(res, event, 'Event created successfully', 201);
    } catch (error) {
      console.error('Error creating event:', error);
      sendError(res, 'Error creating event', 500);
    }
  }

  /**
   * Update event
   * PUT /api/schedule/events/:id
   */
  static async updateEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const eventData = req.body;

      const event = await scheduleService.updateEvent(id, eventData);
      sendSuccess(res, event, 'Event updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      sendError(res, 'Error updating event', 500);
    }
  }

  /**
   * Delete event
   * DELETE /api/schedule/events/:id
   */
  static async deleteEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await scheduleService.deleteEvent(id);
      sendSuccess(res, { id }, 'Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      sendError(res, 'Error deleting event', 500);
    }
  }

  /**
   * Get daily statistics
   * GET /api/schedule/unit/:unitId/stats?date=
   */
  static async getDailyStats(req: Request, res: Response) {
    try {
      const { unitId } = req.params;
      const { date } = req.query;

      if (!date) {
        return sendError(res, 'date is required', 400);
      }

      const stats = await scheduleService.getDailyStats(unitId, new Date(date as string));
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      sendError(res, 'Error fetching stats', 500);
    }
  }

  /**
   * Update event status
   * PATCH /api/schedule/events/:id/status
   */
  static async updateEventStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(EventStatus).includes(status)) {
        return sendError(res, 'Valid status is required', 400);
      }

      const event = await scheduleService.updateEventStatus(id, status);
      sendSuccess(res, event, 'Event status updated');
    } catch (error) {
      console.error('Error updating event status:', error);
      sendError(res, 'Error updating event status', 500);
    }
  }
}
