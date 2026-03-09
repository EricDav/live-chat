import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatSession } from '../../chat/entities/chat.entity';
import { Message } from '../../chat/entities/message.entity';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true, unique: true })
  encrypted?: string;

  @Column({ nullable: true })
  iv?: string;

  @Column({ nullable: true })
  authTag?: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @OneToMany(() => ChatSession, (session) => session.user)
  sessions: ChatSession[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
