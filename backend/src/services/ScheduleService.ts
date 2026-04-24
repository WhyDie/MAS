import { AppDataSource } from '../config/database';
import { ScheduleEvent, EventType, EventStatus } from '../models/ScheduleEvent';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export class ScheduleService {
  private scheduleRepository = AppDataSource.getRepository(ScheduleEvent);

  /**
   * Get schedule events for a date range
   */
  async getEventsByDateRange(
    startDate: Date,
    endDate: Date,
    unitId?: string
  ): Promise<ScheduleEvent[]> {
    const query = this.scheduleRepository.createQueryBuilder('event')
      .where('event.startTime BETWEEN :start AND :end', {
        start: startDate,
        end: endDate
      });

    if (unitId) {
      query.andWhere('event.unitId = :unitId', { unitId });
    }

    return await query.orderBy('event.startTime', 'ASC').getMany();
  }

  /**
   * Get events for a specific user on a given date
   */
  async getUserEventsForDate(
    userId: string,
    date: Date
  ): Promise<ScheduleEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.scheduleRepository
      .createQueryBuilder('event')
      .where('event.assignedUserIds @> :userId', { userId: `["${userId}"]` })
      .andWhere('event.startTime BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay
      })
      .orderBy('event.startTime', 'ASC')
      .getMany();
  }

  /**
   * Get week schedule
   */
  async getWeekSchedule(unitId: string, startDate: Date): Promise<ScheduleEvent[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    return await this.getEventsByDateRange(startDate, endDate, unitId);
  }

  /**
   * Create a new schedule event
   */
  async createEvent(eventData: Partial<ScheduleEvent>): Promise<ScheduleEvent> {
    const event = this.scheduleRepository.create(eventData);
    return await this.scheduleRepository.save(event);
  }

  /**
   * Update existing event
   */
  async updateEvent(id: string, eventData: Partial<ScheduleEvent>): Promise<ScheduleEvent> {
    await this.scheduleRepository.update(id, eventData);
    return await this.scheduleRepository.findOneOrFail({ where: { id } });
  }

  /**
   * Delete event
   */
  async deleteEvent(id: string): Promise<void> {
    await this.scheduleRepository.delete(id);
  }

  /**
   * Get events by type
   */
  async getEventsByType(
    unitId: string,
    type: EventType,
    startDate: Date
  ): Promise<ScheduleEvent[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    return await this.scheduleRepository
      .createQueryBuilder('event')
      .where('event.unitId = :unitId', { unitId })
      .andWhere('event.eventType = :type', { type })
      .andWhere('event.startTime BETWEEN :start AND :end', {
        start: startDate,
        end: endDate
      })
      .orderBy('event.startTime', 'ASC')
      .getMany();
  }

  /**
   * Get upcoming events for a unit
   */
  async getUpcomingEvents(unitId: string, limit: number = 10): Promise<ScheduleEvent[]> {
    const now = new Date();
    return await this.scheduleRepository
      .createQueryBuilder('event')
      .where('event.unitId = :unitId', { unitId })
      .andWhere('event.startTime > :now', { now })
      .orderBy('event.startTime', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * Update event status
   */
  async updateEventStatus(id: string, status: EventStatus): Promise<ScheduleEvent> {
    return await this.updateEvent(id, { status });
  }

  /**
   * Get daily schedule statistics
   */
  async getDailyStats(unitId: string, date: Date): Promise<any> {
    const events = await this.getEventsByDateRange(
      new Date(date.setHours(0, 0, 0, 0)),
      new Date(date.setHours(23, 59, 59, 999)),
      unitId
    );

    const stats = {
      totalEvents: events.length,
      byType: {} as Record<EventType, number>,
      byStatus: {} as Record<EventStatus, number>,
      totalDuration: 0,
      events
    };

    for (const event of events) {
      stats.byType[event.eventType] = (stats.byType[event.eventType] || 0) + 1;
      stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1;
      stats.totalDuration += (event.endTime.getTime() - event.startTime.getTime()) / 60000;
    }

    return stats;
  }
}
