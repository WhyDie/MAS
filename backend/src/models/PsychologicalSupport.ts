import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum SupportSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum SupportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESPONDED = 'responded',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

@Entity('psychological_support')
export class PsychologicalSupport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'simple-enum',
    enum: ['anonymous', 'identified'],
    default: 'anonymous',
  })
  contactType: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  psychologistId?: string;

  @Column({ nullable: true, type: 'text' })
  response?: string;

  @Column({ nullable: true })
  respondedAt?: Date;

  @Column({ nullable: true })
  respondedByUserId?: string;

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'in_progress', 'resolved', 'escalated', 'responded'],
    default: 'pending',
  })
  status: string;

  @Column({
    type: 'simple-enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  })
  severity: string;

  @Column({ type: 'simple-array', nullable: true })
  keywords?: string[];

  @Column({ default: false })
  isEscalated: boolean;

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
