import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // ID користувача, якому призначено сповіщення

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  link: string; // Посилання для переходу (напр. /mentorship)

  @Column()
  type: 'mentorship' | 'schedule' | 'psychology' | 'report' | 'system';

  @Column({ nullable: true })
  severity: 'info' | 'warning' | 'urgent'; // Для виділення кольором

  @CreateDateColumn()
  createdAt: Date;
}