import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('unit_rooms')
export class UnitRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({
    type: 'simple-enum',
    enum: ['command', 'support', 'living', 'food', 'training', 'storage', 'medical', 'other'],
    default: 'other',
  })
  category: string;

  @Column({ nullable: true })
  floor?: number;

  @Column({ nullable: true })
  roomNumber?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

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
