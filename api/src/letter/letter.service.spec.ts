import { Test, TestingModule } from '@nestjs/testing';
import { LetterController } from './letter.controller';
import { LetterService } from './letter.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LetterStatus } from '@prisma/client';

describe('LetterController', () => {
  let letterController: LetterController;
  let letterService: LetterService;

  const mockPrismaService = {
    letter: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockLetterService = {
    createLetter: jest.fn(),
    editLetter: jest.fn(),
    sendLetter: jest.fn(),
    getDraftedLetters: jest.fn(),
    getSentLetters: jest.fn(),
    getSentLetterById: jest.fn(),
    getReceivedLetters: jest.fn(),
    getReceivedLetterById: jest.fn(),
  };

  const mockUser = { id: 'user123' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LetterController],
      providers: [
        { provide: LetterService, useValue: mockLetterService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    letterController = module.get<LetterController>(LetterController);
    letterService = module.get<LetterService>(LetterService);
  });

  describe('draftLetter', () => {
    it('should create a letter', async () => {
      const createLetterDto = {
        recipientId: 'recipient123',
        subject: 'Test Subject',
        content: 'Test Content',
        songUrl: 'http://example.com/song',
        authorId: mockUser.id, // Added authorId
      };
      const result = { id: 'letter123', ...createLetterDto, authorId: mockUser.id };

      mockLetterService.createLetter.mockResolvedValue(result);

      const req = { user: mockUser } as any;
      expect(await letterController.draftLetter(createLetterDto, req)).toEqual(result);
      expect(mockLetterService.createLetter).toHaveBeenCalledWith(createLetterDto, mockUser.id);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const createLetterDto = { recipientId: 'recipient123', subject: 'Test', content: 'Test', songUrl: '', authorId: mockUser.id };
      const req = { user: null } as any;

      await expect(letterController.draftLetter(createLetterDto, req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateDraftedLetter', () => {
    it('should update a drafted letter', async () => {
      const updateLetterDto = { subject: 'Updated Subject', content: 'Updated Content', songUrl: '' };
      const result = { id: 'letter123', ...updateLetterDto, authorId: mockUser.id };

      mockLetterService.editLetter.mockResolvedValue(result);

      const req = { user: mockUser } as any;
      expect(await letterController.updateDraftedLetter('letter123', updateLetterDto, req)).toEqual(result);
      expect(mockLetterService.editLetter).toHaveBeenCalledWith('letter123', updateLetterDto, mockUser.id);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const updateLetterDto = { subject: 'Updated Subject', content: 'Updated Content', songUrl: '' };
      const req = { user: null } as any;

      await expect(letterController.updateDraftedLetter('letter123', updateLetterDto, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('sendLetter', () => {
    it('should send a letter', async () => {
      const sendLetterDto = { deliveryDate: new Date() };
      const result = { id: 'letter123', status: LetterStatus.SENT };

      mockLetterService.sendLetter.mockResolvedValue(result);

      const req = { user: mockUser } as any;
      expect(await letterController.sendLetter('letter123', sendLetterDto, req)).toEqual(result);
      expect(mockLetterService.sendLetter).toHaveBeenCalledWith('letter123', sendLetterDto, mockUser.id);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const sendLetterDto = { deliveryDate: new Date() };
      const req = { user: null } as any;

      await expect(letterController.sendLetter('letter123', sendLetterDto, req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAllDraftedLetters', () => {
    it('should return all drafted letters for the user', async () => {
      const result = [{ id: 'letter123', status: LetterStatus.DRAFT }];

      mockLetterService.getDraftedLetters.mockResolvedValue(result);

      const req = { user: mockUser } as any;
      expect(await letterController.getAllDraftedLetters(req)).toEqual(result);
      expect(mockLetterService.getDraftedLetters).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null } as any;

      await expect(letterController.getAllDraftedLetters(req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getSingleSentLetter', () => {
    it('should return a single sent letter', async () => {
      const result = { id: 'letter123', status: LetterStatus.SENT };

      mockLetterService.getSentLetterById.mockResolvedValue(result);

      const req = { user: mockUser } as any;
      expect(await letterController.getSingleSentLetter('letter123', req)).toEqual(result);
      expect(mockLetterService.getSentLetterById).toHaveBeenCalledWith('letter123', mockUser.id);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null } as any;

      await expect(letterController.getSingleSentLetter('letter123', req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAllReceivedLetters', () => {
    it('should return all received letters for the user', async () => {
      const result = [{ id: 'letter123', status: LetterStatus.SENT }];

      mockLetterService.getReceivedLetters.mockResolvedValue(result);

      const req = { user: mockUser } as any;
      expect(await letterController.getAllReceivedLetters(req)).toEqual(result);
      expect(mockLetterService.getReceivedLetters).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null } as any;

      await expect(letterController.getAllReceivedLetters(req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAllSentLetters', () => {
    it('should return all sent letters for the user', async () => {
      const result = [{ id: 'letter123', status: LetterStatus.SENT }];

      mockLetterService.getSentLetters.mockResolvedValue(result);

      const req = { user: mockUser } as any;
      expect(await letterController.getAllSentLetters(req)).toEqual(result);
      expect(mockLetterService.getSentLetters).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null } as any;

      await expect(letterController.getAllSentLetters(req)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getSingleReceivedLetter', () => {
    it('should return a single received letter', async () => {
      const result = { id: 'letter123', status: LetterStatus.SENT };

      mockLetterService.getReceivedLetterById.mockResolvedValue(result);

      const req = { user: mockUser } as any;
      expect(await letterController.getSingleReceivedLetter('letter123', req)).toEqual(result);
      expect(mockLetterService.getReceivedLetterById).toHaveBeenCalledWith('letter123', mockUser.id);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null } as any;

      await expect(letterController.getSingleReceivedLetter('letter123', req)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if the letter does not exist', async () => {
      mockLetterService.getReceivedLetterById.mockRejectedValue(new NotFoundException());

      const req = { user: mockUser } as any;
      await expect(letterController.getSingleReceivedLetter('nonexistent', req)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if the user tries to access another user’s letter', async () => {
      mockLetterService.getReceivedLetterById.mockRejectedValue(new ForbiddenException());

      const req = { user: mockUser } as any;
      await expect(letterController.getSingleReceivedLetter('letter123', req)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Negative Flows for Other Endpoints', () => {
    it('should throw NotFoundException if the letter does not exist in updateDraftedLetter', async () => {
      mockLetterService.editLetter.mockRejectedValue(new NotFoundException());

      const updateLetterDto = { subject: 'Updated Subject', content: 'Updated Content', songUrl: '' };
      const req = { user: mockUser } as any;

      await expect(letterController.updateDraftedLetter('nonexistent', updateLetterDto, req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if the user tries to update another user’s letter', async () => {
      mockLetterService.editLetter.mockImplementation(() => {
        throw new ForbiddenException();
      });

      const updateLetterDto = { subject: 'Updated Subject', content: 'Updated Content', songUrl: '' };
      const req = { user: mockUser } as any;

      await expect(letterController.updateDraftedLetter('letter123', updateLetterDto, req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if the letter does not exist in sendLetter', async () => {
      mockLetterService.sendLetter.mockRejectedValue(new NotFoundException());

      const sendLetterDto = { deliveryDate: new Date() };
      const req = { user: mockUser } as any;

      await expect(letterController.sendLetter('nonexistent', sendLetterDto, req)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if the user tries to send another user’s letter', async () => {
      mockLetterService.sendLetter.mockImplementation(() => {
        throw new ForbiddenException();
      });

      const sendLetterDto = { deliveryDate: new Date() };
      const req = { user: mockUser } as any;

      await expect(letterController.sendLetter('letter123', sendLetterDto, req)).rejects.toThrow(ForbiddenException);
    });
  });
});