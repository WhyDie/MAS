import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({
    type: 'simple-enum',
    enum: ['issued', 'personal', 'recommended'],
    default: 'personal',
  })
  type: string;

  @Column()
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  purchaseDate?: Date;

  @Column({ nullable: true })
  expiryDate?: Date;

  @Column({ nullable: true })
  manufacturer?: string;

  @Column({ nullable: true })
  serialNumber?: string;

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
