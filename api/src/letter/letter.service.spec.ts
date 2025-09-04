import { Test, TestingModule } from '@nestjs/testing';
import { LetterService } from './letter.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LetterService', () => {
  let service: LetterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LetterService,
        {
          provide: PrismaService,
          useValue: {
            // Mock PrismaService methods as needed
            letter: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LetterService>(LetterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});