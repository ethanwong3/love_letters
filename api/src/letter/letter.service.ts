import { Injectable } from '@nestjs/common';
import { CreateLetterDto } from './dto/create-letter.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { SendLetterDto } from './dto/send-letter.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LetterService {

    constructor(private readonly prismaService: PrismaService) {}

    // draft a letter
    async createLetter(createLetterDto: CreateLetterDto) {
        return;
    }

    // update a drafted letter
    async editLetter(id: string, updateLetterDto: UpdateLetterDto) {
        return;
    }

    // send a letter now or later
    async sendLetter(id: string, sendLetterDto: SendLetterDto) {
        return;
    }

    // get all letters sent
    async getSentLetters() {
        return;
    }

    // get single letter sent
    async getSentLetterById(id: string) {
        return;
    }

    // get all letters received
    async getReceivedLetters() {
        return;
    }

    // get single letter received && mark as read
    async getReceivedLetterById(id: string) {
        return;
    }
}
