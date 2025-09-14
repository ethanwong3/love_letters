import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateLetterDto } from './dto/create-letter.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { SendLetterDto } from './dto/send-letter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LetterStatus } from '@prisma/client';

@Injectable()
export class LetterService {
  constructor(private readonly prisma: PrismaService) {}

  // draft a letter
  async createLetter(createLetterDto: CreateLetterDto, userId: string) {
    // create letter in db
    try {
      const letter = await this.prisma.letter.create({
        data: {
          authorId: userId,
          recipientId: createLetterDto.recipientId,
          subject: createLetterDto.subject,
          content: createLetterDto.content,
          songUrl: createLetterDto.songUrl,
          photoUrl: createLetterDto.photoUrl,
          status: LetterStatus.DRAFT,
          createdAt: createLetterDto.createdAt,
        },
      });
      return letter;
    } catch (error) {
      throw new BadRequestException('Failed to create letter: ' + error.message);
    }
  }

  // update a drafted letter
  async editLetter(id: string, updateLetterDto: UpdateLetterDto, userId: string) {
    // check if user is authorised, letter exists, and is a draft
    const letter = await this.prisma.letter.findUnique({ where: { id } });
    if (letter?.authorId !== userId) {
      throw new ForbiddenException('You cannot edit this letter');
    }
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }
    if (letter.status !== LetterStatus.DRAFT) {
      throw new ForbiddenException('Only drafts can be updated');
    }
    // update letter in db
    try {
      const updated = await this.prisma.letter.update({
        where: { id },
        data: {
          subject: updateLetterDto.subject,
          content: updateLetterDto.content,
          songUrl: updateLetterDto.songUrl,
          photoUrl: updateLetterDto.photoUrl,
          finishedAt: new Date(),
        },
      });
      return updated;
    } catch (error) {
      throw new BadRequestException('Failed to update draft: ' + error.message);
    }
  }

  // send a letter now or later
  async sendLetter(id: string, sendLetterDto: SendLetterDto, userId: string) {
    // check if user is authorised, letter exists, and is a draft
    const letter = await this.prisma.letter.findUnique({ where: { id } });
    if (letter?.authorId !== userId) {
      throw new ForbiddenException('You cannot send this letter');
    }
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }
    if (letter.status !== LetterStatus.DRAFT) {
      throw new ForbiddenException('Only drafts can be sent');
    }
    // update letter in db and send letter to recipient
    try {
      const updated = await this.prisma.letter.update({
        where: { id },
        data: {
          status: sendLetterDto.deliveryDate ? LetterStatus.SCHEDULED : LetterStatus.SENT,
          finishedAt: letter.finishedAt ?? new Date(),
          deliveryDate: sendLetterDto.deliveryDate ?? new Date(),
        },
      });
      return updated;
    } catch (error) {
      throw new BadRequestException('Failed to send letter: ' + error.message);
    }
  }

  // get all letters drafted (by current user)
  async getDraftedLetters(authorId: string) {
    return this.prisma.letter.findMany({
      where: {
        authorId,
        status: LetterStatus.DRAFT,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // get all letters sent (by current user)
  async getSentLetters(authorId: string) {
    return this.prisma.letter.findMany({
      where: {
        authorId,
        status: { in: [LetterStatus.SCHEDULED, LetterStatus.SENT] }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // get single letter sent
  async getSentLetterById(id: string, authorId: string) {
    // ensure letter exists and is only being accessed by author
    const letter = await this.prisma.letter.findUnique({ where: { id } });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }
    if (letter.authorId !== authorId) {
      throw new ForbiddenException('You cannot access this letter');
    }
    return letter;
  }

  // get all letters received (by current user)
  async getReceivedLetters(recipientId: string) {
    return this.prisma.letter.findMany({
      where: {
        recipientId,
        deliveryDate: { lte: new Date() },
      },
      orderBy: { deliveryDate: 'desc' },
    });
  }

  // get single letter received && mark as read
  async getReceivedLetterById(id: string, recipientId: string) {
    // ensure letter exists and is only being accessed by recipient if it has been sent
    const letter = await this.prisma.letter.findUnique({ where: { id } });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }
    if (letter.recipientId !== recipientId) {
      throw new ForbiddenException('You cannot access this letter');
    }
    if (letter.status === LetterStatus.DRAFT) {
      throw new ForbiddenException('WTF, you should not be seeing this letter, it is unsent');
    }
    if (letter.deliveryDate && letter.deliveryDate > new Date()) {
      throw new ForbiddenException('WTF, you should not be seeing this letter, it is undelivered');
    }

    // mark as read
    const updated = await this.prisma.letter.update({
      where: { id },
      data: {
        status: LetterStatus.OPENED,
      },
    });

    return updated;
  }
}
