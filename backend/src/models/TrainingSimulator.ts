import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum SimulatorType {
  SCENARIO = 'scenario',
  QUIZ = 'quiz',
  COMBAT_DRILL = 'combat_drill',
  SURVIVAL = 'survival',
  COMMUNICATION = 'communication',
}

export enum SimulatorDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  EXTREME = 'extreme',
}

export interface ScenarioChoice {
  text: string;
  nextScenarioId?: string;
  consequences?: {
    health?: number; // -10 to 0
    morale?: number; // -5 to 5
    objective?: number; // 0-100
    message: string;
  };
  score?: number;
}

export interface ScenarioNode {
  id: string;
  text: string;
  image?: string;
  choices: ScenarioChoice[];
  consequences?: {
    health?: number;
    morale?: number;
    objective?: number;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  image?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  timeLimit?: number; // seconds
  score: number;
}

@Entity('training_simulators')
export class TrainingSimulator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'simple-enum',
    enum: SimulatorType,
    default: SimulatorType.SCENARIO,
  })
  type: SimulatorType;

  @Column({
    type: 'simple-enum',
    enum: SimulatorDifficulty,
    default: SimulatorDifficulty.NORMAL,
  })
  difficulty: SimulatorDifficulty;

  @Column()
  category: string;

  @Column({ type: 'integer', default: 5 })
  estimatedMinutes: number;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  // For scenarios
  @Column({ type: 'simple-json', nullable: true })
  scenarioFlow?: {
    startNodeId: string;
    nodes: ScenarioNode[];
    maxScore: number;
    passingScore: number;
  };

  // For quizzes
  @Column({ type: 'simple-json', nullable: true })
  quizContent?: {
    questions: QuizQuestion[];
    randomizeOrder?: boolean;
    maxScore: number;
    passingScore: number;
    timeLimit?: number; // total minutes
  };

  @Column({ type: 'integer', default: 0 })
  completionCount: number;

  @Column({ type: 'float', default: 0 })
  averageScore: number;

  @Column({ type: 'float', default: 0 })
  averageTimeMinutes: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: false })
  requiresCompletion: boolean;

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

@Entity('simulator_attempts')
export class SimulatorAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  simulatorId: string;

  @Column({ type: 'integer', default: 0 })
  score: number;

  @Column({ type: 'integer', default: 0 })
  maxScore: number;

  @Column({ type: 'integer', default: 0 })
  timeSpentSeconds: number;

  @Column({ default: 'in_progress' })
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';

  @Column({ type: 'simple-json', nullable: true })
  choices?: Record<string, any>; // Scenario choices or quiz answers

  @Column({ type: 'simple-json', nullable: true })
  stats?: {
    health?: number;
    morale?: number;
    objective?: number;
    decisions?: number;
    correctAnswers?: number;
    wrongAnswers?: number;
  };

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ default: false })
  isPassed: boolean;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  beforeInsert() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
