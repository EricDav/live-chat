import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async encrypt(@Query('data') data) {
    return this.chatService.encrypt(data);
  }

  @Get('/users/:userId')
  async validateUser(@Param('userId') userId) {
    return this.chatService.validateUser(userId);
  }

  @Get('/sessions')
  async getAllActiveSessions() {
    return this.chatService.getAllActiveSessions();
  }

  @Get('/messages')
  async getSessionMessages(@Query() query) {
    return this.chatService.getMessages(query)
  }

}
