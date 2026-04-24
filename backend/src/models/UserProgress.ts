import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  moduleId: string;

  @Column({ type: 'integer', default: 0 })
  completionPercentage: number;

  @Column({ type: 'integer', default: 0 })
  score?: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ type: 'simple-json', nullable: true })
  answers?: any;

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
