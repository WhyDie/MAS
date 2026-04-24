import { AppDataSource } from '../config/database';
import { Equipment } from '../models/Equipment';
import { Like } from 'typeorm';

export class EquipmentService {
  private equipmentRepository = AppDataSource.getRepository(Equipment);

  /**
   * Add equipment for a user
   */
  async addEquipment(
    userId: string,
    name: string,
    type: 'issued' | 'personal' | 'recommended',
    category: string,
    weight?: number,
    cost?: number,
    purchaseDate?: Date,
    expiryDate?: Date,
    serialNumber?: string
  ): Promise<Equipment> {
    const equipment = this.equipmentRepository.create({
      userId,
      name,
      type,
      category,
      weight: weight || 0,
      cost: cost || 0,
      purchaseDate,
      expiryDate,
      serialNumber
    });

    return await this.equipmentRepository.save(equipment);
  }

  /**
   * Get user's equipment
   */
  async getUserEquipment(userId: string): Promise<Equipment[]> {
    return await this.equipmentRepository
      .createQueryBuilder('equipment')
      .where('equipment.userId = :userId', { userId })
      .orderBy('equipment.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get equipment by type
   */
  async getEquipmentByType(
    userId: string,
    type: 'issued' | 'personal' | 'recommended'
  ): Promise<Equipment[]> {
    return await this.equipmentRepository
      .createQueryBuilder('equipment')
      .where('equipment.userId = :userId', { userId })
      .andWhere('equipment.type = :type', { type })
      .getMany();
  }

  /**
   * Get equipment by category
   */
  async getEquipmentByCategory(userId: string, category: string): Promise<Equipment[]> {
    return await this.equipmentRepository
      .createQueryBuilder('equipment')
      .where('equipment.userId = :userId', { userId })
      .andWhere('equipment.category = :category', { category })
      .getMany();
  }

  /**
   * Update equipment
   */
  async updateEquipment(id: string, data: Partial<Equipment>): Promise<Equipment> {
    await this.equipmentRepository.update(id, data);
    return await this.equipmentRepository.findOneOrFail({ where: { id } });
  }

  /**
   * Delete equipment
   */
  async deleteEquipment(id: string): Promise<void> {
    await this.equipmentRepository.delete(id);
  }

  /**
   * Get total weight of equipment
   */
  async getTotalWeight(userId: string, type?: 'issued' | 'personal' | 'recommended'): Promise<number> {
    let query = this.equipmentRepository
      .createQueryBuilder('equipment')
      .select('SUM(equipment.weight)', 'totalWeight')
      .where('equipment.userId = :userId', { userId });

    if (type) {
      query.andWhere('equipment.type = :type', { type });
    }

    const result = await query.getRawOne();
    return parseInt(result.totalWeight) || 0;
  }

  /**
   * Get total cost of equipment
   */
  async getTotalCost(userId: string, type?: 'issued' | 'personal' | 'recommended'): Promise<number> {
    let query = this.equipmentRepository
      .createQueryBuilder('equipment')
      .select('SUM(equipment.cost)', 'totalCost')
      .where('equipment.userId = :userId', { userId });

    if (type) {
      query.andWhere('equipment.type = :type', { type });
    }

    const result = await query.getRawOne();
    return parseInt(result.totalCost) || 0;
  }

  /**
   * Get equipment statistics
   */
  async getEquipmentStats(userId: string): Promise<any> {
    const allEquipment = await this.getUserEquipment(userId);
    const issued = await this.getEquipmentByType(userId, 'issued');
    const personal = await this.getEquipmentByType(userId, 'personal');
    const recommended = await this.getEquipmentByType(userId, 'recommended');

    const stats = {
      totalItems: allEquipment.length,
      byType: {
        issued: issued.length,
        personal: personal.length,
        recommended: recommended.length
      },
      totalWeight: {
        issued: issued.reduce((sum, e) => sum + (e.weight || 0), 0),
        personal: personal.reduce((sum, e) => sum + (e.weight || 0), 0),
        recommended: recommended.reduce((sum, e) => sum + (e.weight || 0), 0),
        total: allEquipment.reduce((sum, e) => sum + (e.weight || 0), 0)
      },
      totalCost: {
        issued: issued.reduce((sum, e) => sum + (e.cost || 0), 0),
        personal: personal.reduce((sum, e) => sum + (e.cost || 0), 0),
        recommended: recommended.reduce((sum, e) => sum + (e.cost || 0), 0),
        total: allEquipment.reduce((sum, e) => sum + (e.cost || 0), 0)
      },
      expiringSoon: allEquipment.filter(e => {
        if (!e.expiryDate) return false;
        const daysUntilExpiry = (e.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      })
    };

    return stats;
  }

  /**
   * Search equipment
   */
  async searchEquipment(userId: string, query: string): Promise<Equipment[]> {
    return await this.equipmentRepository
      .createQueryBuilder('equipment')
      .where('equipment.userId = :userId', { userId })
      .andWhere(
        '(equipment.name ILIKE :query OR equipment.category ILIKE :query OR equipment.serialNumber ILIKE :query)',
        { query: `%${query}%` }
      )
      .getMany();
  }

  /**
   * Get equipment recommendations based on specialization
   */
  async getRecommendedEquipment(specialization: string): Promise<string[]> {
    const recommendations: { [key: string]: string[] } = {
      'pikhota': [
        'Карабін АК',
        'Бронежилет',
        'Рюкзак тактичний',
        'Каска',
        'Ніч-глаз',
        'Рації',
        'Перший оказ'
      ],
      'mekhanik': [
        'Набір інструментів',
        'Мультимер',
        'Щиток управління',
        'Паро-очки',
        'Робочі рукавиці',
        'Голівка лампи'
      ],
      'medyk': [
        'Комплект MARCH',
        'Шина',
        'Джгут',
        'Стерильна пов\'язка',
        'Антибіотики',
        'Лікувальні витрати'
      ],
      'zvyazkovets': [
        'Рація PRC-152',
        'Антена',
        'Зарядний пристрій',
        'Батареї',
        'Коробка розміщення'
      ],
      'snaiper': [
        'Снайперська рушниця',
        'Оптичний приціл',
        'Глушувач',
        'Сумка для амуніції',
        'Монопод',
        'Дальномір'
      ]
    };

    const key = specialization.toLowerCase();
    return recommendations[key] || recommendations['pikhota'];
  }

  /**
   * Check for expiring equipment
   */
  async checkExpiringEquipment(userId: string): Promise<Equipment[]> {
    const allEquipment = await this.getUserEquipment(userId);
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return allEquipment.filter(
      e => e.expiryDate && e.expiryDate > now && e.expiryDate < thirtyDaysLater
    );
  }

  /**
   * Get categories available in equipment
   */
  async getAvailableCategories(): Promise<string[]> {
    const categories = [
      'Зброя',
      'Захист',
      'Амуніція',
      'Комунікація',
      'Медична',
      'Інструменти',
      'Одяг',
      'Спорядження',
      'Інше'
    ];
    return categories;
  }
}
