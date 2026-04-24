import { DataSource } from 'typeorm';
import { config } from './config';
import { User } from '../models/User';
import { InviteCode } from '../models/InviteCode';
import { OfflineSyncData } from '../models/OfflineSyncData';
import { TrainingModule } from '../models/TrainingModule';
import { UserProgress } from '../models/UserProgress';
import { UserOnboarding } from '../models/UserOnboarding';
import { Equipment } from '../models/Equipment';
import { ScheduleEvent } from '../models/ScheduleEvent';
import { PsychologicalSupport } from '../models/PsychologicalSupport';
import { MentorshipRequest } from '../models/MentorshipRequest';
import { KnowledgeBaseArticle } from '../models/KnowledgeBaseArticle';
import { TrainingSimulator } from '../models/TrainingSimulator';
import { SimulatorAttempt } from '../models/TrainingSimulator';
import { UnitRoom } from '../models/UnitRoom';
import { UnitStaff } from '../models/UnitStaff';
import { UnitArrivalStep } from '../models/UnitArrivalStep';
import { MilitaryResource } from '../models/MilitaryResource';

export const AppDataSource = new DataSource({
  type: config.database.type as any,
  host: config.database.type === 'better-sqlite3' ? undefined : config.database.host,
  port: config.database.type === 'better-sqlite3' ? undefined : config.database.port,
  username: config.database.type === 'better-sqlite3' ? undefined : config.database.username,
  password: config.database.type === 'better-sqlite3' ? undefined : config.database.password,
  database: config.database.type === 'better-sqlite3' ? config.database.path : config.database.name,
  synchronize: config.app.nodeEnv === 'development',
  logging: config.app.nodeEnv === 'development',
  entities: [
    User,
    InviteCode,
    OfflineSyncData,
    TrainingModule,
    UserProgress,
    UserOnboarding,
    Equipment,
    ScheduleEvent,
    PsychologicalSupport,
    MentorshipRequest,
    KnowledgeBaseArticle,
    TrainingSimulator,
    SimulatorAttempt,
    UnitRoom,
    UnitStaff,
    UnitArrivalStep,
    MilitaryResource,
  ],
  migrations: ['src/migrations/*.ts'],
  migrationsRun: true,
});

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connected successfully');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};
