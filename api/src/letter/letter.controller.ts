import { 
  Controller, 
  Post, 
  Patch, 
  Get, 
  Param, 
  Body, 
  UseGuards, 
  Req, 
  UnauthorizedException
} from '@nestjs/common';
import { LetterService } from './letter.service';
import { CreateLetterDto } from './dto/create-letter.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { SendLetterDto } from './dto/send-letter.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { Request } from 'express';

@Controller('letter')
@UseGuards(JwtAuthGuard)
export class LetterController {
  constructor(private readonly letterService: LetterService) {}

  // draft a letter
  @Post()
  async draftLetter(@Body() createLetterDto: CreateLetterDto, @Req() req: Request) {
    if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['id'];
    return this.letterService.createLetter(createLetterDto, userId);
  }

  // update a drafted letter
  @Patch(':id')
  async updateDraftedLetter(
    @Param('id') id: string, 
    @Body() updateLetterDto: UpdateLetterDto, 
    @Req() req: Request
  ) {
    if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['id'];
    return this.letterService.editLetter(id, updateLetterDto, userId);
  }

  // send a letter now or later
  @Post(':id/send')
  async sendLetter(
    @Param('id') id: string, 
    @Body() sendLetterDto: SendLetterDto, 
    @Req() req: Request
  ) {
    if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['id'];
    return this.letterService.sendLetter(id, sendLetterDto, userId);
  }

  // get all drafted letters for current user
  @Get('drafts')
  async getAllDraftedLetters(@Req() req: Request) {
    if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['id'];
    return this.letterService.getDraftedLetters(userId);
  }

  // get all sent letters for current user
  @Get('sent')
  async getAllSentLetters(@Req() req: Request) {
    if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['id'];
    return this.letterService.getSentLetters(userId);
  }

  // get single sent letter (only if it belongs to current user)
  @Get('sent/:id')
  async getSingleSentLetter(@Param('id') id: string, @Req() req: Request) {
    if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['id'];
    return this.letterService.getSentLetterById(id, userId);
  }

  // get all received letters for current user
  @Get('received')
  async getAllReceivedLetters(@Req() req: Request) {
    if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['id'];
    return this.letterService.getReceivedLetters(userId);
  }

  // get single received letter && mark as read
  @Get('received/:id')
  async getSingleReceivedLetter(@Param('id') id: string, @Req() req: Request) {
    if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['id'];
    return this.letterService.getReceivedLetterById(id, userId);
  }
}
