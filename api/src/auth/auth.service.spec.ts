import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtUtil } from './utils/jwt.util';
import { PasswordUtil } from './utils/password.util';
import { BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

jest.mock('./utils/password.util', () => ({
  PasswordUtil: {
    hashPassword: jest.fn(),
    comparePasswords: jest.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwtUtil: { generateToken: jest.Mock; verifyToken: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtUtil,
          useValue: {
            generateToken: jest.fn(),
            verifyToken: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtUtil = module.get(JwtUtil);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw if email is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });

      await expect(
        service.register({ email: 'test@test.com', password: '123', displayName: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if BCRYPT_SALT_ROUNDS is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      configService.get.mockImplementation((key: string) => {
        if (key === 'BCRYPT_SALT_ROUNDS') return undefined;
        if (key === 'JWT_SECRET') return 'secret';
        return undefined;
      });

      await expect(
        service.register({ email: 'test@test.com', password: '123', displayName: 'Test' }),
      ).rejects.toThrow(Error);
    });

    it('should throw if user creation fails', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      configService.get.mockImplementation((key: string) => {
        if (key === 'BCRYPT_SALT_ROUNDS') return 10;
        if (key === 'JWT_SECRET') return 'secret';
        return undefined;
      });
      (PasswordUtil.hashPassword as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.register({ email: 'test@test.com', password: '123', displayName: 'Test' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should create user and return token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      configService.get.mockImplementation((key: string) => {
        if (key === 'BCRYPT_SALT_ROUNDS') return 10;
        if (key === 'JWT_SECRET') return 'secret';
        if (key === 'JWT_EXPIRES_IN') return '15m';
        return undefined;
      });
      (PasswordUtil.hashPassword as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        passwordHash: 'hashed',
        displayName: 'Test',
      });
      jwtUtil.generateToken.mockReturnValue('fakeToken');

      const result = await service.register({
        email: 'test@test.com',
        password: '123',
        displayName: 'Test',
      });

      expect(result.user.email).toBe('test@test.com');
      expect(result.token).toBe('fakeToken');
    });
  });

  describe('login', () => {
    it('should throw if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@test.com', password: '123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        passwordHash: 'hashed',
      });
      (PasswordUtil.comparePasswords as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should login user and return token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        passwordHash: 'hashed',
        displayName: 'Test',
      });
      (PasswordUtil.comparePasswords as jest.Mock).mockResolvedValue(true);
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'secret';
        if (key === 'JWT_EXPIRES_IN') return '15m';
        return undefined;
      });
      jwtUtil.generateToken.mockReturnValue('fakeToken');

      const result = await service.login({ email: 'test@test.com', password: '123' });

      expect(result.user.email).toBe('test@test.com');
      expect(result.token).toBe('fakeToken');
    });
  });

  /*describe('logout', () => {
    it('should return a success message (stateless JWT)', async () => {
      const result = await service.logout();
      expect(result).toEqual({ message: 'Successfully logged out (client must discard JWT)' });
    });
  });*/
});
