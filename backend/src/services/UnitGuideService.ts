import { AppDataSource } from '../config/database';
import { UnitRoom } from '../models/UnitRoom';
import { UnitStaff } from '../models/UnitStaff';
import { UnitArrivalStep } from '../models/UnitArrivalStep';
import { MilitaryResource } from '../models/MilitaryResource';

export class UnitGuideService {
  private roomRepo = AppDataSource.getRepository(UnitRoom);
  private staffRepo = AppDataSource.getRepository(UnitStaff);
  private stepRepo = AppDataSource.getRepository(UnitArrivalStep);
  private resourceRepo = AppDataSource.getRepository(MilitaryResource);

  // ===== ROOMS =====

  async getAllRooms(category?: string): Promise<UnitRoom[]> {
    const where: any = { isActive: true };
    if (category) where.category = category;
    return this.roomRepo.find({ where, order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  async getRoomById(id: string): Promise<UnitRoom | null> {
    return this.roomRepo.findOne({ where: { id } });
  }

  async createRoom(data: Partial<UnitRoom>): Promise<UnitRoom> {
    const room = this.roomRepo.create(data);
    return this.roomRepo.save(room);
  }

  async updateRoom(id: string, data: Partial<UnitRoom>): Promise<UnitRoom | null> {
    await this.roomRepo.update(id, data);
    return this.roomRepo.findOne({ where: { id } });
  }

  async deleteRoom(id: string): Promise<boolean> {
    const result = await this.roomRepo.update(id, { isActive: false });
    return (result.affected || 0) > 0;
  }

  async reorderRooms(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.roomRepo.update(ids[i], { sortOrder: i });
    }
  }

  // ===== STAFF =====

  async getAllStaff(): Promise<UnitStaff[]> {
    return this.staffRepo.find({ where: { isActive: true }, order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  async getStaffById(id: string): Promise<UnitStaff | null> {
    return this.staffRepo.findOne({ where: { id } });
  }

  async createStaff(data: Partial<UnitStaff>): Promise<UnitStaff> {
    const staff = this.staffRepo.create(data);
    return this.staffRepo.save(staff);
  }

  async updateStaff(id: string, data: Partial<UnitStaff>): Promise<UnitStaff | null> {
    await this.staffRepo.update(id, data);
    return this.staffRepo.findOne({ where: { id } });
  }

  async deleteStaff(id: string): Promise<boolean> {
    const result = await this.staffRepo.update(id, { isActive: false });
    return (result.affected || 0) > 0;
  }

  async reorderStaff(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.staffRepo.update(ids[i], { sortOrder: i });
    }
  }

  // ===== ARRIVAL STEPS =====

  async getAllSteps(): Promise<UnitArrivalStep[]> {
    return this.stepRepo.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async getStepById(id: string): Promise<UnitArrivalStep | null> {
    return this.stepRepo.findOne({ where: { id } });
  }

  async createStep(data: Partial<UnitArrivalStep>): Promise<UnitArrivalStep> {
    const maxOrder = await this.stepRepo.findOne({
      order: { sortOrder: 'DESC' },
    });
    const sortOrder = maxOrder ? maxOrder.sortOrder + 1 : 0;
    const step = this.stepRepo.create({ ...data, sortOrder });
    return this.stepRepo.save(step);
  }

  async updateStep(id: string, data: Partial<UnitArrivalStep>): Promise<UnitArrivalStep | null> {
    await this.stepRepo.update(id, data);
    return this.stepRepo.findOne({ where: { id } });
  }

  async deleteStep(id: string): Promise<boolean> {
    const result = await this.stepRepo.update(id, { isActive: false });
    return (result.affected || 0) > 0;
  }

  async reorderSteps(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.stepRepo.update(ids[i], { sortOrder: i });
    }
  }

  // ===== MILITARY RESOURCES =====

  async getAllResources(category?: string): Promise<MilitaryResource[]> {
    const where: any = { isActive: true };
    if (category) where.category = category;
    return this.resourceRepo.find({ where, order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  async getResourceById(id: string): Promise<MilitaryResource | null> {
    return this.resourceRepo.findOne({ where: { id } });
  }

  async createResource(data: Partial<MilitaryResource>): Promise<MilitaryResource> {
    const resource = this.resourceRepo.create(data);
    return this.resourceRepo.save(resource);
  }

  async updateResource(id: string, data: Partial<MilitaryResource>): Promise<MilitaryResource | null> {
    await this.resourceRepo.update(id, data);
    return this.resourceRepo.findOne({ where: { id } });
  }

  async deleteResource(id: string): Promise<boolean> {
    const result = await this.resourceRepo.update(id, { isActive: false });
    return (result.affected || 0) > 0;
  }

  async reorderResources(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.resourceRepo.update(ids[i], { sortOrder: i });
    }
  }
}

export const unitGuideService = new UnitGuideService();
