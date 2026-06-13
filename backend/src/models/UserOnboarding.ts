import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('user_onboarding')
export class UserOnboarding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column('simple-json')
  profileAnswers: {
    militaryExperience: 'none' | 'conscript' | 'contract' | 'officer';
    education: string;
    specialization: string;
    physicalFitness: number;
    concerns: string[];
    skills: string[];
    preferredLearning: 'visual' | 'audio' | 'practical' | 'mixed';
    mentorPreference: boolean;
    nightShiftExperience: boolean;
  };

  @Column('simple-json')
  generatedTrajectory: {
    trajectory: string[];
    estimatedDuration: number;
    difficulty: 'легко' | 'нормально' | 'складно';
    roadmap: {
      week: number;
      title: string;
      modules: string[];
      goals: string[];
      milestones: string[];
    }[];
    personalRecommendations: string[];
  };

  @Column('simple-json')
  progress: {
    week: number;
    completedModules: number;
    totalModules: number;
    score: number;
  } = { week: 1, completedModules: 0, totalModules: 0, score: 0 };

  @Column({ default: false })
  isCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
