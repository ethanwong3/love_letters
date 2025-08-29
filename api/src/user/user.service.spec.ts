import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  // jest hook before test
  beforeEach(async () => {
    // create a testing module that provides UserService and a mocked PrismaService
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();
    // get instances of UserService and PrismaService from the testing module
    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const userData = { email: 'test@example.com', passwordHash: 'hashed', displayName: 'Test User' };
      const createdUser = { id: '1', ...userData, createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(prismaService.user, 'create').mockResolvedValue(createdUser);

      const result = await userService.createUser(userData);
      expect(result).toEqual(createdUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({ data: userData });
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      const userId = '1';
      const user = { id: userId, email: 'test@example.com', passwordHash: 'hashed', displayName: 'Test User', createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);

      const result = await userService.getUserById(userId);
      expect(result).toEqual(user);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const userId = '1';
      const updateData = { displayName: 'Updated User' };
      const updatedUser = { id: userId, email: 'test@example.com', passwordHash: 'hashed', displayName: 'Updated User', createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await userService.updateUser(userId, updateData);
      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({ where: { id: userId }, data: updateData });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const userId = '1';
      const deletedUser = { id: userId, email: 'test@example.com', passwordHash: 'hashed', displayName: 'Test User', createdAt: new Date(), updatedAt: new Date() };

      jest.spyOn(prismaService.user, 'delete').mockResolvedValue(deletedUser);

      const result = await userService.deleteUser(userId);
      expect(result).toEqual(deletedUser);
      expect(prismaService.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        { id: '1', email: 'test1@example.com', passwordHash: 'hashed1', displayName: 'User 1', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', email: 'test2@example.com', passwordHash: 'hashed2', displayName: 'User 2', createdAt: new Date(), updatedAt: new Date() },
      ];

      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(users);

      const result = await userService.findAll();
      expect(result).toEqual(users);
      expect(prismaService.user.findMany).toHaveBeenCalled();
    });
  });
});