import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Message } from './message.entity';

export enum SessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

@Entity()
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  user: User;

  @Column({ nullable: true })
  title?: string; // e.g. "Order Support #123"

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.OPEN })
  status: SessionStatus;

  @OneToMany(() => Message, (message) => message.session, { cascade: true })
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  closedAt?: Date;

  @Column({ nullable: true })
  closedBy?: string; // admin user id
}
