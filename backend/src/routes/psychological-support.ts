import express from 'express';
import { PsychologicalSupportController } from '../controllers/PsychologicalSupportController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Create new support request
 * POST /api/psychological-support/request
 * Body: { message, contactType?, severity, keywords? }
 * Returns: PsychologicalSupport object
 */
router.post('/request', PsychologicalSupportController.createRequest);

/**
 * Get my requests
 * GET /api/psychological-support/my-requests?status=pending
 * Query: status? (pending | in_progress | responded | escalated | resolved)
 * Returns: PsychologicalSupport[]
 */
router.get('/my-requests', PsychologicalSupportController.getUserRequests);

/**
 * Get pending requests (psychologist only)
 * GET /api/psychological-support/pending
 * Query: limit? (default 20)
 * Returns: PsychologicalSupport[]
 * Access: PSYCHOLOGIST role
 */
router.get('/pending', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'psychologist' && userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, PsychologicalSupportController.getPendingRequests);

/**
 * Get critical requests
 * GET /api/psychological-support/critical
 * Returns: PsychologicalSupport[] (only critical severity)
 * Access: PSYCHOLOGIST role
 */
router.get('/critical', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'psychologist' && userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, PsychologicalSupportController.getCriticalRequests);

/**
 * Get anonymous requests (psychologist)
 * GET /api/psychological-support/anonymous
 * Query: limit? (default 10)
 * Returns: PsychologicalSupport[] (without userId)
 * Access: PSYCHOLOGIST role
 */
router.get('/anonymous', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'psychologist' && userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, PsychologicalSupportController.getAnonymousRequests);

/**
 * Get audio recommendations
 * GET /api/psychological-support/audio?severity=low
 * Query: severity? (low | medium | high | critical)
 * Returns: { audioTracks: AudioTrack[] }
 */
router.get('/audio', PsychologicalSupportController.getAudioRecommendations);

/**
 * Get support statistics
 * GET /api/psychological-support/stats
 * Returns: { total, byStatus: {}, bySeverity: {}, averageResolutionTime }
 * Access: PSYCHOLOGIST role
 */
router.get('/stats', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'psychologist' && userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, PsychologicalSupportController.getStats);

/**
 * Get trend analysis
 * GET /api/psychological-support/trends?days=30
 * Query: days? (default 30)
 * Returns: { period, moodTrend: [], requestTrend: [], criticalCount }
 */
router.get('/trends', PsychologicalSupportController.getTrendAnalysis);

/**
 * Search requests by keywords
 * GET /api/psychological-support/search?keywords=stress,sleep
 * Query: keywords (comma-separated)
 * Returns: PsychologicalSupport[] (matching requests)
 */
router.get('/search', PsychologicalSupportController.searchByKeywords);

/**
 * Get requests by severity
 * GET /api/psychological-support/severity/:severity
 * Params: severity (low | medium | high | critical)
 * Returns: PsychologicalSupport[] (filtered by severity)
 * Access: PSYCHOLOGIST role
 */
router.get('/severity/:severity', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'psychologist' && userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, PsychologicalSupportController.getRequestsBySeverity);

/**
 * Get single request (with privacy checks)
 * GET /api/psychological-support/:id
 * Returns: PsychologicalSupport (may hide userId if anonymous)
 */
router.get('/:id', PsychologicalSupportController.getRequest);

/**
 * Log mood check-in
 * POST /api/psychological-support/mood
 * Body: { mood: 1-10, notes? }
 * Returns: { moodLog entry }
 */
router.post('/mood', PsychologicalSupportController.logMood);

/**
 * Respond to support request
 * POST /api/psychological-support/:id/respond
 * Body: { response: string }
 * Returns: PsychologicalSupport (updated with response)
 * Access: PSYCHOLOGIST role
 */
router.post('/:id/respond', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'psychologist' && userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, PsychologicalSupportController.respondToRequest);

/**
 * Escalate support request
 * POST /api/psychological-support/:id/escalate
 * Body: { reason: string }
 * Returns: PsychologicalSupport (status: escalated)
 * Access: PSYCHOLOGIST role
 */
router.post('/:id/escalate', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'psychologist' && userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, PsychologicalSupportController.escalateRequest);

/**
 * Resolve support request
 * POST /api/psychological-support/:id/resolve
 * Returns: PsychologicalSupport (status: resolved)
 * Access: PSYCHOLOGIST role
 */
router.post('/:id/resolve', (req, res, next) => {
  const userRole = req.user!.role;
  if (userRole !== 'psychologist' && userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}, PsychologicalSupportController.resolveRequest);

export default router;
