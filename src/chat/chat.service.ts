// src/chat/chat.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Role, User } from 'src/user/entities/user.entity';
import { ChatSession, SessionStatus } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import * as shortid from 'shortid';
import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'node:crypto';
import { config } from 'src/config';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;          // 256 bits
const IV_LENGTH = 12;           // GCM recommended
const AUTH_TAG_LENGTH = 16;


@Injectable()
export class ChatService {
  private userRepo: Repository<User>;
  private sessionRepo: Repository<ChatSession>;
  private messageRepo: Repository<Message>;
  

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    this.userRepo = this.entityManager.getRepository(User);
    this.sessionRepo = this.entityManager.getRepository(ChatSession);
    this.messageRepo = this.entityManager.getRepository(Message);
  }

  async getOrCreateActiveSession(
    userId: string,
    email: string,
    name?: string,
  ): Promise<ChatSession> {
    let user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      await this.userRepo.insert({
        id: shortid,
        email,
        name: name || email.split('@')[0],
        role: 'USER' as Role,
      });
    }

    let session = await this.sessionRepo.findOne({
      where: { user: { id: user.id }, status: SessionStatus.OPEN },
      relations: ['user'],
    });

    if (!session) {
      session = await this.sessionRepo.save({ userId: user.id, id: userId });
    }

    return session;
  }

  async createMessage(
    sessionId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    console.log('SenderID', senderId, '===>>>>')
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    if (!session || session.status !== SessionStatus.OPEN) {
      throw new BadRequestException('Session not found or closed');
    }

    const user = await this.userRepo.findOne({
      where: {
        encrypted: senderId
      }
    })

    const message = this.messageRepo.create({
      id: shortid(),
      content,
      senderId: user.id  as any,
    });

    return this.messageRepo.save({
      id: shortid(),
      content,
      senderId: senderId  as any,
    });
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    return this.messageRepo.find({
      where: { session: { id: sessionId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async getAllActiveSessions(): Promise<ChatSession[]> {
    return this.sessionRepo.find({
      where: { status: SessionStatus.OPEN },
      relations: ['user', 'messages'],
      order: { createdAt: 'DESC' },
    });
  }

  async closeSession(
    sessionId: string,
    closedBy: string,
  ): Promise<ChatSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    session.status = SessionStatus.CLOSED;
    session.closedAt = new Date();
    session.closedBy = closedBy;

    return this.sessionRepo.save(session);
  }

  async encrypt(plainText) {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, config.secretKey, iv);
  
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
  
    const authTag = cipher.getAuthTag().toString('hex');
    await this.userRepo.insert({
      id: shortid(),
      email: plainText,
      iv: iv.toString('hex'),
      encrypted,
      authTag
    });

    return {
      iv: iv.toString('hex'),
      encrypted,
      authTag,
    };
  }

  // Derive a secure key from a password/salt
  getKeyFromPassword(password, salt = randomBytes(16)) {
    return pbkdf2Sync(password, salt, 600_000, KEY_LENGTH, 'sha256');
  }

  async decrypt(encrypted) {
    const user = await this.userRepo.findOne({
      where: {
        encrypted
      }
    });

    console.log(user, 'User:::::');

    const decipher = createDecipheriv(
      ALGORITHM,
      config.secretKey,
      Buffer.from(user.iv.toString(), 'hex')
    );

    decipher.setAuthTag(Buffer.from(user.authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
