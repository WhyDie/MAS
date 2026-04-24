import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../types';

export { UserRole };

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  rank?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ nullable: true })
  civilProfession?: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.RECRUIT,
  })
  role: UserRole;

  @Column({ nullable: true })
  unitId?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  profilePictureUrl?: string;

  @Column({ type: 'simple-json', nullable: true })
  preferences?: {
    theme?: 'dark' | 'red-light' | 'light';
    notifications?: boolean;
    language?: string;
  };

  @Column({ type: 'simple-json', nullable: true })
  offlineSyncData?: any;

  @Column({ nullable: true })
  encryptedLocalKey?: string;

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
