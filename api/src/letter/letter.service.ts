import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateLetterDto } from './dto/create-letter.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { SendLetterDto } from './dto/send-letter.dto';
import { PrismaService } from 'src/prisma/prisma.service';

// too sack to make this global, just copy pasting this lol
enum LetterStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  OPENED = 'OPENED',
}

@Injectable()
export class LetterService {
  constructor(private readonly prisma: PrismaService) {}

  // draft a letter
  async createLetter(createLetterDto: CreateLetterDto) {
    try {
      const letter = await this.prisma.letter.create({
        data: {
          authorId: createLetterDto.authorId,
          recipientId: createLetterDto.recipientId,
          subject: createLetterDto.subject,
          content: createLetterDto.content,
          songUrl: createLetterDto.songUrl,
          status: LetterStatus.DRAFT, // remove this from DTO too?
        },
      });

      return letter;
    } catch (error) {
      throw new BadRequestException('Failed to create draft letter: ' + error.message);
    }
  }

  // update a drafted letter
  async editLetter(id: string, updateLetterDto: UpdateLetterDto) {
    const existing = await this.prisma.letter.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Letter not found');
    }
    if (existing.status !== LetterStatus.DRAFT) {
      throw new ForbiddenException('Only drafts can be updated');
    }

    try {
      const updated = await this.prisma.letter.update({
        where: { id },
        data: {
          subject: updateLetterDto.subject,
          content: updateLetterDto.content,
          songUrl: updateLetterDto.songUrl,
          finishedAt: updateLetterDto.finishedAt ?? existing.finishedAt,
        },
      });
      return updated;
    } catch (error) {
      throw new BadRequestException('Failed to update draft: ' + error.message);
    }
  }

  // send a letter now or later
  async sendLetter(id: string, sendLetterDto: SendLetterDto) {
    const existing = await this.prisma.letter.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Letter not found');
    }
    if (existing.status !== LetterStatus.DRAFT) {
      throw new ForbiddenException('Only drafts can be sent');
    }

    try {
      const updated = await this.prisma.letter.update({
        where: { id },
        data: {
          status: LetterStatus.SENT,
          deliveryDate: sendLetterDto.deliveryDate ?? new Date(), // send immediately if no date
          finishedAt: sendLetterDto.finishedAt ?? new Date(), // mark as finished at send
        },
      });
      return updated;
    } catch (error) {
      throw new BadRequestException('Failed to send letter: ' + error.message);
    }
  }

  // get all letters sent (by current user)
  async getSentLetters(authorId: string) {
    return this.prisma.letter.findMany({
      where: {
        authorId,
        status: LetterStatus.SENT,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // get single letter sent
  async getSentLetterById(id: string, authorId: string) {
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
        status: LetterStatus.SENT,
        deliveryDate: { lte: new Date() }, // only show delivered
      },
      orderBy: { deliveryDate: 'desc' },
    });
  }

  // get single letter received && mark as read
  async getReceivedLetterById(id: string, recipientId: string) {
    const letter = await this.prisma.letter.findUnique({ where: { id } });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }
    if (letter.recipientId !== recipientId) {
      throw new ForbiddenException('You cannot access this letter');
    }
    if (letter.status !== LetterStatus.SENT) {
      throw new ForbiddenException('This letter has not been sent yet');
    }
    if (letter.deliveryDate && letter.deliveryDate > new Date()) {
      throw new ForbiddenException('This letter is not yet available');
    }

    // mark as read (business model: optional read receipts)
    const updated = await this.prisma.letter.update({
      where: { id },
      data: {
        // You could add a "readAt" field in schema if read tracking is needed
      },
    });

    return updated;
  }
}
