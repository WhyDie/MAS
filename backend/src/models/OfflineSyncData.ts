import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('offline_sync_data')
export class OfflineSyncData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  dataType: string;

  @Column({ type: 'simple-json' })
  data: any;

  @Column()
  localVersion: number;

  @Column()
  serverVersion: number;

  @Column({ default: false })
  isPending: boolean;

  @Column({ nullable: true })
  lastSyncedAt?: Date;

  @Column({ type: 'simple-array', nullable: true })
  conflictedWith?: string[];

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
