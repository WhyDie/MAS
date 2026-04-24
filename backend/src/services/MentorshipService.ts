import { AppDataSource } from '../config/database';
import { MentorshipRequest, MentorshipStatus, MentorshipTopic } from '../models/MentorshipRequest';
import { User, UserRole } from '../models/User';

export class MentorshipService {
  private mentorshipRepository = AppDataSource.getRepository(MentorshipRequest);
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Create mentorship request
   */
  async createRequest(
    recruitId: string,
    topic: MentorshipTopic,
    description: string,
    requiredSkills?: string[],
    isAnonymous: boolean = false
  ): Promise<MentorshipRequest> {
    const request = this.mentorshipRepository.create({
      recruitId,
      topic,
      description,
      requiredSkills,
      isAnonymous,
      status: MentorshipStatus.OPEN
    });

    return await this.mentorshipRepository.save(request);
  }

  /**
   * Get open mentorship requests
   */
  async getOpenRequests(
    page: number = 1,
    limit: number = 20,
    topic?: MentorshipTopic
  ): Promise<{ requests: MentorshipRequest[]; total: number }> {
    const query = this.mentorshipRepository
      .createQueryBuilder('request')
      .where('request.status = :status', { status: MentorshipStatus.OPEN });

    if (topic) {
      query.andWhere('request.topic = :topic', { topic });
    }

    const [requests, total] = await query
      .orderBy('request.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { requests, total };
  }

  /**
   * Get mentor's assigned requests
   */
  async getMentorRequests(
    mentorId: string,
    status?: MentorshipStatus
  ): Promise<MentorshipRequest[]> {
    const query = this.mentorshipRepository
      .createQueryBuilder('request')
      .where('request.mentorId = :mentorId', { mentorId });

    if (status) {
      query.andWhere('request.status = :status', { status });
    }

    return await query.orderBy('request.updatedAt', 'DESC').getMany();
  }

  /**
   * Get recruit's mentorship requests
   */
  async getRecruitRequests(recruitId: string): Promise<MentorshipRequest[]> {
    return await this.mentorshipRepository
      .createQueryBuilder('request')
      .where('request.recruitId = :recruitId', { recruitId })
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Assign mentor to request
   */
  async assignMentor(requestId: string, mentorId: string): Promise<MentorshipRequest> {
    const request = await this.mentorshipRepository.findOneOrFail({
      where: { id: requestId }
    });

    // Verify mentor exists and has mentor role
    const mentor = await this.userRepository.findOneOrFail({
      where: { id: mentorId }
    });

    if (mentor.role !== UserRole.MENTOR && mentor.role !== UserRole.ADMIN) {
      throw new Error('Selected user is not a mentor');
    }

    request.mentorId = mentorId;
    request.status = MentorshipStatus.ASSIGNED;

    return await this.mentorshipRepository.save(request);
  }

  /**
   * Accept mentorship request (mentor action)
   */
  async acceptRequest(requestId: string, mentorId: string): Promise<MentorshipRequest> {
    const request = await this.mentorshipRepository.findOneOrFail({
      where: { id: requestId }
    });

    if (request.mentorId && request.mentorId !== mentorId) {
      throw new Error('This request is already assigned to another mentor');
    }

    request.mentorId = mentorId;
    request.status = MentorshipStatus.IN_PROGRESS;

    return await this.mentorshipRepository.save(request);
  }

  /**
   * Respond to request
   */
  async respondToRequest(requestId: string, response: string): Promise<MentorshipRequest> {
    const request = await this.mentorshipRepository.findOneOrFail({
      where: { id: requestId }
    });

    request.response = response;
    request.respondedAt = new Date();
    request.status = MentorshipStatus.IN_PROGRESS;

    return await this.mentorshipRepository.save(request);
  }

  /**
   * Complete mentorship
   */
  async completeRequest(requestId: string): Promise<MentorshipRequest> {
    const request = await this.mentorshipRepository.findOneOrFail({
      where: { id: requestId }
    });

    request.status = MentorshipStatus.COMPLETED;
    request.completedAt = new Date();

    return await this.mentorshipRepository.save(request);
  }

  /**
   * Cancel mentorship request
   */
  async cancelRequest(requestId: string, reason?: string): Promise<MentorshipRequest> {
    const request = await this.mentorshipRepository.findOneOrFail({
      where: { id: requestId }
    });

    request.status = MentorshipStatus.CANCELLED;
    if (reason) {
      request.response = `Cancelled: ${reason}`;
    }

    return await this.mentorshipRepository.save(request);
  }

  /**
   * Add feedback to mentorship
   */
  async addFeedback(
    requestId: string,
    mentorRating?: number,
    recruiteRating?: number,
    comments?: string
  ): Promise<MentorshipRequest> {
    const request = await this.mentorshipRepository.findOneOrFail({
      where: { id: requestId }
    });

    request.feedback = {
      mentorRating: mentorRating || 0,
      recruiteRating: recruiteRating || 0,
      comments: comments || ''
    };

    return await this.mentorshipRepository.save(request);
  }

  /**
   * Get available mentors for a topic
   */
  async getAvailableMentors(topic?: MentorshipTopic): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.MENTOR });

    if (topic) {
      // In a more complex system, this would check mentor's specializations
      query.andWhere('user.specialization LIKE :topic', { topic: `%${topic}%` });
    }

    return await query.getMany();
  }

  /**
   * Get mentorship statistics
   */
  async getMentorStatsAsync(mentorId: string): Promise<any> {
    const requests = await this.getMentorRequests(mentorId);

    const stats = {
      totalRequests: requests.length,
      active: requests.filter(r => r.status === MentorshipStatus.IN_PROGRESS).length,
      completed: requests.filter(r => r.status === MentorshipStatus.COMPLETED).length,
      avgRating: 0,
      topicDistribution: {} as Record<MentorshipTopic, number>
    };

    if (requests.length > 0) {
      const ratings = requests
        .filter(r => r.feedback?.mentorRating)
        .map(r => r.feedback?.mentorRating || 0);

      if (ratings.length > 0) {
        stats.avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      }

      for (const request of requests) {
        stats.topicDistribution[request.topic] =
          (stats.topicDistribution[request.topic] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Search mentors by skills
   */
  async searchMentorsBySkills(skills: string[]): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.MENTOR })
      .andWhere('user.skills @> :skills', { skills: JSON.stringify(skills) })
      .getMany();
  }

  /**
   * Get recommendation of best mentor for recruit
   */
  async recommendMentor(recruitId: string, topic: MentorshipTopic): Promise<User | null> {
    // Get recruit info
    const recruit = await this.userRepository.findOneOrFail({
      where: { id: recruitId }
    });

    // Find mentors with similar background or expertise
    const mentors = await this.getAvailableMentors(topic);

    if (mentors.length === 0) return null;

    // Sort by experience (you can enhance this algorithm)
    const mentorStats = await Promise.all(
      mentors.map(async mentor => ({
        mentor,
        stats: await this.getMentorStatsAsync(mentor.id)
      }))
    );

    // Return mentor with highest average rating and completed requests
    const best = mentorStats.reduce((prev, current) =>
      (current.stats.avgRating > prev.stats.avgRating || 
       (current.stats.avgRating === prev.stats.avgRating && 
        current.stats.completed > prev.stats.completed))
        ? current
        : prev
    );

    return best.mentor;
  }
}
