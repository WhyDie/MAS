import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('unit_staff')
export class UnitStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rank: string;

  @Column()
  fullName: string;

  @Column()
  position: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  room?: string;

  @Column({ nullable: true })
  floor?: number;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  description?: string;

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
