import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('invite_codes')
export class InviteCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  createdByUserId: string;

  @Column({ nullable: true })
  usedByUserId?: string;

  @Column({ type: 'datetime', nullable: true })
  usedAt?: Date;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @Column({
    type: 'simple-enum',
    enum: ['recruit', 'mentor', 'commander', 'psychologist', 'admin', 'superadmin'],
    default: 'recruit',
  })
  defaultRole: string;

  @Column({ nullable: true })
  unitId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  beforeInsert() {
    if (!this.id) {
      this.id = uuidv4();
    }
    if (!this.code) {
      this.code = this.generateCode();
    }
  }

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}
