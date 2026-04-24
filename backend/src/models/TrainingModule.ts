import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('training_modules')
export class TrainingModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string;

  @Column({ type: 'integer', default: 0 })
  durationMinutes: number;

  @Column({
    type: 'simple-enum',
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  })
  difficulty: string;

  @Column({ type: 'simple-json' })
  content: {
    text?: string;
    images?: string[];
    videos?: string[];
    steps?: Array<{
      title: string;
      description: string;
      image?: string;
    }>;
    quiz?: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
  };

  @Column({ default: true })
  isOfflineAvailable: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

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
