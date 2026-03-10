import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChatSession } from './chat.entity';

@Entity()
export class Message {
  @PrimaryColumn()
  id: string;

  @Column('text')
  content: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  @Column()
  sessionId: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
