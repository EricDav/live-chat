// src/chat/chat.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WsException,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { UseGuards } from '@nestjs/common';
  import { WsJwtGuard } from 'src/common/guards/ws-jwt.guard';
  import { ChatService } from './chat.service';
  import * as shortid from 'shortid';
//   import { SendMessageDto } from './dto/send-message.dto';
//   import { JoinChatDto } from './dto/join-chat.dto';
  
@WebSocketGateway({
  cors: {
    origin: '*',                     // For testing — works on Render
    // Better production version (replace with your actual frontend URL(s)):
    // origin: ['https://your-frontend.onrender.com', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,              // Set true only if using cookies/auth
  },
  path: '/socket.io/',               // Explicit path (good practice)
  pingInterval: 25000,
  pingTimeout: 60000,
})
  export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
  
    constructor(private chatService: ChatService) {}
  
    // async handleConnection(client: Socket) {
    //   // Token validation can be here or via guard per method
    // }
  
    // handleDisconnect(client: Socket) {
    //   // Optional: cleanup or broadcast offline
    // }
  
    // @UseGuards(WsJwtGuard)
    @SubscribeMessage('joinChat')
    async handleJoin(
      @MessageBody() dto: any,
      @ConnectedSocket() client: Socket,
    ) {
      // console.log(client.data, 'Client Data.....', dto);
      // const user = client.data.id; // from JWT guard
      const email = await this.chatService.decrypt(dto.id);
      console.log(email, 'Email.........');

  
      const session = await this.chatService.getOrCreateActiveSession(shortid(), email, dto.name);
  
      client.join(session.id);
  
      const history = await this.chatService.getSessionMessages(session.id);
      client.emit('chatHistory', history);
  
      // Notify admins
      this.server.to('admins').emit('sessionUpdate', {
        sessionId: session.id,
        userEmail: session.user.email,
        action: 'joined',
      });

        // ADD THIS LINE:
      return { sessionId: session.id }; 
    }
  
    // @UseGuards(WsJwtGuard)
    @SubscribeMessage('sendMessage')
    async handleMessage(
      @MessageBody() dto: any,
      @ConnectedSocket() client: Socket | any,
    ) {
      const user = client.data.user;
      console.log(dto, 'DTO');
      console.log(client.data, 'CLIENT')
      const message = await this.chatService.createMessage(
        dto.sessionId,
        dto.senderId,
        dto.content,
      );
  
      this.server.to(dto.sessionId).emit('newMessage', message);

      // ADD THIS LINE: This broadcasts the message to all connected admins
      // this.server.to('admins').emit('newMessage', message);
    }
  
    // @UseGuards(WsJwtGuard)
    @SubscribeMessage('adminJoinAll')
    async handleAdminJoin(@ConnectedSocket() client: Socket, @MessageBody() dto: any,) {
      // const user = client.data.user;
      // if (user.role !== 'ADMIN') throw new Error('Forbidden');
  
      client.join('admins');
  
      const activeSessions = await this.chatService.getAllActiveSessions();
      client.emit('activeSessions', activeSessions);
    }
  
    // @UseGuards(WsJwtGuard)
    @SubscribeMessage('closeSession')
    async handleClose(
      @MessageBody() dto: { sessionId: string },
      @ConnectedSocket() client: Socket,
    ) {
      const user = client.data.user;
      if (user.role !== 'ADMIN') throw new Error('Forbidden');
  
      await this.chatService.closeSession(dto.sessionId, user.sub);
  
      this.server.to(dto.sessionId).emit('sessionClosed', { sessionId: dto.sessionId });
      this.server.to('admins').emit('sessionUpdate', { sessionId: dto.sessionId, action: 'closed' });
    }

    async handleConnection(client: Socket) {
        try {
          console.log(`Client connected: ${client.id}`);
          // WS Guard logic moved to middleware or per-method for simplicity
          // const token = client.handshake.auth.token;
          // if (!token) client.disconnect();
          // You can verify here or rely on guards per event
        } catch (e) {
          client.disconnect();
        }
      }
    
      async handleDisconnect(client: Socket) {
        // Optional: mark user offline, broadcast if needed
        console.log(`Client disconnected: ${client.id}`);
      }
    
    
      // ── Admin-only ────────────────────────────────────────────────
    
    
      // @UseGuards(WsJwtGuard)
      @SubscribeMessage('closeSession')
      async handleCloseSession(
        @MessageBody() { sessionId }: { sessionId: string },
        @ConnectedSocket() client: Socket,
      ) {
        const user = client.data.user;
        if (user.role !== 'ADMIN') throw new WsException('Forbidden');
    
        await this.chatService.closeSession(sessionId, user.sub);
    
        // Notify everyone in room
        this.server.to(sessionId).emit('sessionClosed', { sessionId });
    
        // Notify admin dashboard
        this.server.to('admin-room').emit('sessionClosed', { sessionId });
      }
  }