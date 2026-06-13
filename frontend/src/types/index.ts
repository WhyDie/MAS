export type UserRole = 'recruit' | 'mentor' | 'commander' | 'psychologist' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  unitId?: string;
  rank?: string;
  position?: string;
  civilProfession?: string;
  profilePictureUrl?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications: boolean;
  language: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: any;
  isOfflineAvailable: boolean;
  tags?: string[];
  viewCount: number;
  createdAt: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  moduleId: string;
  completionPercentage: number;
  score?: number;
  isCompleted: boolean;
  completedAt?: Date;
  attemptCount: number;
}

export interface UserStats {
  totalModules: number;
  completedModules: number;
  completionRate: number;
  inProgressModules: number;
  averageScore: number;
  lastActivityAt?: Date;
}

export interface SyncData {
  id: string;
  userId: string;
  dataType: string;
  data: any;
  localVersion: number;
  serverVersion: number;
  isPending: boolean;
  lastSyncedAt?: Date;
}

export interface PsychologicalSupportRequest {
  id: string;
  userId: string;
  message: string;
  contactType: 'anonymous' | 'identified';
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated' | 'responded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  response?: string;
  respondedAt?: Date;
}

export interface ScheduleEvent {
  id: string;
  unitId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  eventType: 'training' | 'duty' | 'meal' | 'meeting' | 'medical' | 'rest' | 'other';
  location?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Equipment {
  id: string;
  userId: string;
  name: string;
  description?: string;
  weight?: number;
  cost?: number;
  type: 'issued' | 'personal' | 'recommended';
  category: string;
  isActive: boolean;
}
