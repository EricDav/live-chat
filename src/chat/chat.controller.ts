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
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

@Controller('/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async encrypt(@Query('data') data) {
    return this.chatService.encrypt(data);
  }

}
