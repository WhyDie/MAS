import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum EventType {
  TRAINING = 'training',
  DUTY = 'duty',
  MEAL = 'meal',
  MEETING = 'meeting',
  MEDICAL = 'medical',
  REST = 'rest',
  OTHER = 'other',
}

export enum EventStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('schedule_events')
export class ScheduleEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  unitId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({
    type: 'simple-enum',
    enum: ['training', 'duty', 'meal', 'meeting', 'medical', 'rest', 'other'],
    default: 'other',
  })
  eventType: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'simple-array', nullable: true })
  assignedUserIds?: string[];

  @Column({
    type: 'simple-enum',
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status: string;

  @Column({ default: false })
  notifyParticipants: boolean;

  @Column({ nullable: true })
  createdByUserId?: string;

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
