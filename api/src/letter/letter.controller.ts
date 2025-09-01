import { Controller, Post, Patch, Get, Param, Body } from '@nestjs/common';
import { LetterService } from './letter.service';
import { CreateLetterDto } from './dto/create-letter.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { SendLetterDto } from './dto/send-letter.dto';

@Controller('letter')
export class LetterController {
    constructor(private readonly letterService: LetterService) {}

    // draft a letter
    @Post()
    async draftLetter(@Body() createLetterDto: CreateLetterDto) {
        return this.letterService.createLetter(createLetterDto);
    }

    // update a drafted letter
    @Patch(':id')
    async updateDraftedLetter(@Param('id') id: string, @Body() updateLetterDto: UpdateLetterDto) {
        return this.letterService.editLetter(id, updateLetterDto);
    }

    // send a letter now or later
    @Post(':id/send')
    async sendLetter(@Param('id') id: string, @Body() sendLetterDto: SendLetterDto) {
        return this.letterService.sendLetter(id, sendLetterDto);
    }

    // get all letters sent
    @Get('sent')
    async getAllSentLetters() {
        return this.letterService.getSentLetters();
    }

    // get single letter sent
    @Get('sent/:id')
    async getSingleSentLetter(@Param('id') id: string) {
        return this.letterService.getSentLetterById(id);
    }

    // get all letters received
    @Get('received')
    async getAllReceivedLetters() {
        return this.letterService.getReceivedLetters();
    }

    // get single letter received && mark as read
    @Get('received/:id')
    async getSingleReceivedLetter(@Param('id') id: string) {
        return this.letterService.getReceivedLetterById(id);
    }
}