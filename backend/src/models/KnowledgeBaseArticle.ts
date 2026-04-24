import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum KnowledgeCategory {
  TACTICAL_MEDICINE = 'tactical_medicine',
  WEAPONS = 'weapons',
  TOPOGRAPHY = 'topography',
  MODERN_THREATS = 'modern_threats',
  SURVIVAL = 'survival',
  COMMUNICATIONS = 'communications'
}

export enum Difficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

@Entity('knowledge_base_articles')
@Index(['category', 'difficulty'])
@Index(['title'])
export class KnowledgeBaseArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('text')
  content: string; // Markdown formatted

  @Column({
    type: 'simple-enum',
    enum: KnowledgeCategory
  })
  category: KnowledgeCategory;

  @Column({
    type: 'simple-enum',
    enum: Difficulty,
    default: Difficulty.BEGINNER
  })
  difficulty: Difficulty;

  @Column('text', { array: true })
  tags: string[];

  @Column('text', { nullable: true })
  videoUrl?: string;

  @Column('text', { nullable: true })
  audioUrl?: string;

  @Column('text', { array: true, nullable: true })
  imageUrls?: string[];

  @Column('simple-json', { nullable: true })
  references?: {
    title: string;
    url: string;
    type: 'book' | 'manual' | 'video' | 'external';
  }[];

  @Column('simple-json', { nullable: true })
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];

  @Column({ default: 0 })
  estimatedMinutes: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ nullable: true })
  authorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
