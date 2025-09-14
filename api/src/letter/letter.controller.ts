import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LetterService } from './letter.service';
import { CreateLetterDto } from './dto/create-letter.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { SendLetterDto } from './dto/send-letter.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { Request } from 'express';

// custom filename generator for uploaded files
function fileNameGenerator(req, file, cb) {
  const random = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = extname(file.originalname) || '';
  cb (null, `${random}${ext}`);
}

// file filter to allow only images and audio files
function imageFileFilter(req, file, cb) {
  if (!file.mimetype.match(/^image\/(png|jpeg|jpg|webp)$/)) {
    cb(new BadRequestException('Only image files are allowed (png, jpg, jpeg, webp)'), false);
  } else {
    cb(null, true);
  }
}

// file filter to allow only audio files
function audioFileFilter(req, file, cb) {
  if (!file.mimetype.match(/^(audio\/(mpeg|mp3|wav|ogg|aac))$/)) {
    cb(new BadRequestException('Only audio files are allowed (mp3, wav, ogg, aac)'), false);
  } else {
    cb(null, true);
  }
}

@Controller('letter')
@UseGuards(JwtAuthGuard)
export class LetterController {
  constructor(private readonly letterService: LetterService) {}

  // draft a letter (with optional photo and song upload)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'photo', maxCount: 1 },
        { name: 'song', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads', // ensure this folder exists with write perms
          filename: fileNameGenerator,
        }),
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB limit (apply for each file)
        },
        fileFilter: (req, file, cb) => {
          // route-level filtering - decide by fieldname
          if (file.fieldname === 'photo') return imageFileFilter(req, file, cb);
          if (file.fieldname === 'song') return audioFileFilter(req, file, cb);
          cb(null, false);
        },
      },
    ),
  )
  async draftLetter(
    @UploadedFiles() files: { photo?: Express.Multer.File[]; song?: Express.Multer.File[] },
    @Body() createLetterDto: CreateLetterDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['id'];

    // if multer saved photo/song, create public URLs
    const host = process.env.PUBLIC_BASE_URL || `http://${req.headers.host || 'localhost:4000'}`; // ensure PUBLIC_BASE_URL in env for prod
    if (files?.photo?.[0]) {
      createLetterDto.photoUrl = `${host}/uploads/${files.photo[0].filename}`;
    }
    if (files?.song?.[0]) {
      // prefer file upload over provided URL
      createLetterDto.songUrl = `${host}/uploads/${files.song[0].filename}`;
    }

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
