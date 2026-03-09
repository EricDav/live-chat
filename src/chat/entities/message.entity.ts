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
  senderId: number;

  @ManyToOne(() => ChatSession, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  session: ChatSession;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
