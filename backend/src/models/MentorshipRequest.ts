import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum MentorshipTopic {
  TACTICAL_MEDICINE = 'tactical_medicine',
  WEAPONS = 'weapons',
  TOPOGRAPHY = 'topography',
  SURVIVAL = 'survival',
  COMMUNICATIONS = 'communications',
  LEADERSHIP = 'leadership',
  GENERAL = 'general',
}

export enum MentorshipStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('mentorship_requests')
export class MentorshipRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recruitId: string;

  @Column({ nullable: true })
  mentorId?: string;

  @Column()
  topic: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  skills?: string[];

  @Column({ type: 'simple-array', nullable: true })
  requiredSkills?: string[];

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'declined', 'open', 'assigned', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({ nullable: true, type: 'text' })
  response?: string;

  @Column({ nullable: true })
  respondedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ type: 'simple-json', nullable: true })
  feedback?: {
    mentorRating?: number;
    recruiteRating?: number;
    comments?: string;
  };

  @Column({ nullable: true })
  rating?: number;

  @Column({ default: false })
  isAnonymous: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  beforeInsert() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
