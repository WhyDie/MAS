/// <reference types="vite/client" />
import axios from 'axios';
import { UserProgress } from '../types/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// AI chat with longer timeout
export const aiChat = async (message: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
    signal: AbortSignal.timeout(45000),
  });
  return response.json();
};

// Додати токен до кожного запиту
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обробити помилки
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    inviteCode: string;
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  validateToken: () => api.get('/auth/validate'),

  createInviteCode: (data: { role: string; expiresIn: number }) =>
    api.post('/auth/create-invite', data),

  getInviteCodes: () => api.get('/auth/invite-codes'),
};

export const trainingService = {
  getAllModules: (page = 1, limit = 20, category?: string) =>
    api.get('/training/modules', {
      params: { page, limit, category },
    }),

  getModuleById: (id: string) => api.get(`/training/modules/${id}`),

  getUserProgress: (moduleId: string) => api.get(`/training/progress/${moduleId}`),

  updateUserProgress: (moduleId: string, progress: Partial<UserProgress>) =>
    api.put(`/training/progress/${moduleId}`, progress),

  getUserStats: () => api.get('/training/stats'),
};

export const syncService = {
  pushChanges: (changes: any[]) =>
    api.post('/sync/push', { changes }),

  pullChanges: (since?: Date) =>
    api.get('/sync/pull', {
      params: since ? { since: since.toISOString() } : {},
    }),

  getPendingChanges: () => api.get('/sync/pending'),

  resolveConflict: (syncId: string, resolution: string, mergedData?: any) =>
    api.post(`/sync/resolve/${syncId}`, { resolution, mergedData }),
};

export const onboardingService = {
  generateTrajectory: (profileAnswers: any) =>
    api.post('/onboarding/generate-trajectory', { profileAnswers }),

  completeOnboarding: (profileAnswers: any, trajectory: any) =>
    api.post('/onboarding/complete', { profileAnswers, trajectory }),

  getStatus: () => api.get('/onboarding/status'),

  updateProgress: (completedModules: number, totalModules: number) =>
    api.put('/onboarding/progress', { completedModules, totalModules }),

  getRecommendations: () => api.get('/onboarding/recommendations'),
};

export const psychologicalSupportService = {
  createRequest: (message: string, severity: string, contactType: string, keywords?: string[]) =>
    api.post('/psychological-support/request', { message, severity, contactType, keywords }),

  getUserRequests: (status?: string) =>
    api.get('/psychological-support/my-requests', {
      params: status ? { status } : {},
    }),

  getPendingRequests: (limit = 20) =>
    api.get('/psychological-support/pending', { params: { limit } }),

  getCriticalRequests: () =>
    api.get('/psychological-support/critical'),

  respondToRequest: (id: string, response: string) =>
    api.post(`/psychological-support/${id}/respond`, { response }),

  escalateRequest: (id: string, reason: string) =>
    api.post(`/psychological-support/${id}/escalate`, { reason }),

  resolveRequest: (id: string) =>
    api.post(`/psychological-support/${id}/resolve`),

  getStats: () =>
    api.get('/psychological-support/stats'),

  getRequestsBySeverity: (severity: string) =>
    api.get(`/psychological-support/severity/${severity}`),

  searchByKeywords: (keywords: string[]) =>
    api.get('/psychological-support/search', {
      params: { keywords: keywords.join(',') },
    }),

  getAudioRecommendations: (severity = 'low') =>
    api.get('/psychological-support/audio', { params: { severity } }),

  logMood: (mood: number, notes?: string) =>
    api.post('/psychological-support/mood', { mood, notes }),

  getTrendAnalysis: (days = 30) =>
    api.get('/psychological-support/trends', { params: { days } }),

  getAnonymousRequests: (limit = 10) =>
    api.get('/psychological-support/anonymous', { params: { limit } }),

  getRequest: (id: string) =>
    api.get(`/psychological-support/${id}`),
};

export const mentorshipService = {
  createRequest: (topic: string, description?: string, requestedMentorId?: string) =>
    api.post('/mentorship/requests', { topic, description, requestedMentorId }),

  getMyRequests: (status?: string) =>
    api.get('/mentorship/recruit/requests', {
      params: status ? { status } : {},
    }),

  getMentorRequests: () =>
    api.get('/mentorship/mentor/requests'),

  getOpenRequests: () =>
    api.get('/mentorship/requests/open'),

  getAvailableMentors: (topic?: string) =>
    api.get('/mentorship/mentors/available', {
      params: topic ? { topic } : {},
    }),

  acceptRequest: (requestId: string) =>
    api.post(`/mentorship/requests/${requestId}/accept`),

  respondToRequest: (requestId: string, response: string) =>
    api.post(`/mentorship/requests/${requestId}/respond`, { response }),

  completeRequest: (requestId: string) =>
    api.post(`/mentorship/requests/${requestId}/complete`),

  cancelRequest: (requestId: string) =>
    api.post(`/mentorship/requests/${requestId}/cancel`),

  addFeedback: (requestId: string, rating: number, feedback: string) =>
    api.post(`/mentorship/requests/${requestId}/feedback`, { rating, feedback }),

  recommendMentor: (topic: string) =>
    api.get('/mentorship/recommend', { params: { topic } }),

  getMentorStats: () =>
    api.get('/mentorship/mentor/stats'),

  searchMentors: (keywords?: string[]) =>
    api.get('/mentorship/mentors/search', {
      params: keywords ? { keywords: keywords.join(',') } : {},
    }),
};

export const trainingSimulatorService = {
  getAllSimulators: (page = 1, limit = 20, category?: string, type?: string, difficulty?: string) =>
    api.get('/training-simulators', {
      params: { page, limit, ...(category && { category }), ...(type && { type }), ...(difficulty && { difficulty }) },
    }),

  getSimulator: (id: string) =>
    api.get(`/training-simulators/${id}`),

  getByCategory: (categoryId: string) =>
    api.get(`/training-simulators/category/${categoryId}`),

  getByType: (type: string) =>
    api.get(`/training-simulators/type/${type}`),

  getByDifficulty: (difficulty: string) =>
    api.get(`/training-simulators/difficulty/${difficulty}`),

  search: (query: string) =>
    api.get('/training-simulators/search', { params: { query } }),

  getRecommendations: () =>
    api.get('/training-simulators/recommended'),

  getCategories: () =>
    api.get('/training-simulators/categories'),

  startAttempt: (simulatorId: string) =>
    api.post(`/training-simulators/${simulatorId}/start`),

  handleScenarioChoice: (attemptId: string, nodeId: string, choiceIndex: number) =>
    api.post(`/training-simulators/attempt/${attemptId}/choice`, { nodeId, choiceIndex }),

  handleQuizAnswer: (attemptId: string, questionId: string, answerIndex: number) =>
    api.post(`/training-simulators/attempt/${attemptId}/answer`, { questionId, answerIndex }),

  completeAttempt: (attemptId: string) =>
    api.post(`/training-simulators/attempt/${attemptId}/complete`),

  abandonAttempt: (attemptId: string) =>
    api.post(`/training-simulators/attempt/${attemptId}/abandon`),

  getUserAttempts: (simulatorId: string, page = 1, limit = 20) =>
    api.get(`/training-simulators/${simulatorId}/my-attempts`, { params: { page, limit } }),

  getUserBestAttempt: (simulatorId: string) =>
    api.get(`/training-simulators/${simulatorId}/best-attempt`),

  getAllUserAttempts: (page = 1, limit = 20) =>
    api.get('/training-simulators/my-progress', { params: { page, limit } }),

  getUserStats: () =>
    api.get('/training-simulators/my-stats'),

  getLeaderboard: (simulatorId: string) =>
    api.get(`/training-simulators/${simulatorId}/leaderboard`),

  createSimulator: (data: any) =>
    api.post('/training-simulators', data),

  updateSimulator: (id: string, data: any) =>
    api.put(`/training-simulators/${id}`, data),

  deleteSimulator: (id: string) =>
    api.delete(`/training-simulators/${id}`),
};

export { api };
export default api;
