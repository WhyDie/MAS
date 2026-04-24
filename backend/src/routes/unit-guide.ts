import { Router } from 'express';
import { unitGuideController } from '../controllers/UnitGuideController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ===== PUBLIC READ ROUTES =====

// Rooms
router.get('/rooms', unitGuideController.getAllRooms);
router.get('/rooms/reorder', unitGuideController.reorderRooms);
router.get('/rooms/:id', unitGuideController.getRoomById);

// Staff
router.get('/staff', unitGuideController.getAllStaff);
router.get('/staff/reorder', unitGuideController.reorderStaff);
router.get('/staff/:id', unitGuideController.getStaffById);

// Arrival Steps
router.get('/steps', unitGuideController.getAllSteps);
router.get('/steps/reorder', unitGuideController.reorderSteps);
router.get('/steps/:id', unitGuideController.getStepById);

// ===== ADMIN CRUD ROUTES =====

// Rooms CRUD
router.post('/rooms', authMiddleware, unitGuideController.createRoom);
router.put('/rooms/reorder', authMiddleware, unitGuideController.reorderRooms);
router.put('/rooms/:id', authMiddleware, unitGuideController.updateRoom);
router.delete('/rooms/:id', authMiddleware, unitGuideController.deleteRoom);

// Staff CRUD
router.post('/staff', authMiddleware, unitGuideController.createStaff);
router.put('/staff/reorder', authMiddleware, unitGuideController.reorderStaff);
router.put('/staff/:id', authMiddleware, unitGuideController.updateStaff);
router.delete('/staff/:id', authMiddleware, unitGuideController.deleteStaff);

// Arrival Steps CRUD
router.post('/steps', authMiddleware, unitGuideController.createStep);
router.put('/steps/reorder', authMiddleware, unitGuideController.reorderSteps);
router.put('/steps/:id', authMiddleware, unitGuideController.updateStep);
router.delete('/steps/:id', authMiddleware, unitGuideController.deleteStep);

// Military Resources CRUD
router.get('/resources', unitGuideController.getAllResources);
router.get('/resources/reorder', unitGuideController.reorderResources);
router.get('/resources/:id', unitGuideController.getResourceById);
router.post('/resources', authMiddleware, unitGuideController.createResource);
router.put('/resources/reorder', authMiddleware, unitGuideController.reorderResources);
router.put('/resources/:id', authMiddleware, unitGuideController.updateResource);
router.delete('/resources/:id', authMiddleware, unitGuideController.deleteResource);

export default router;
