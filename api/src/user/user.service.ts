import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client'; // for type safety type definitions

@Injectable()
export class UserService {
  // inject PrismaService to access the database
  constructor(private prisma: PrismaService) {}

  // handles POST /user endpoint logic
  async createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  // handles GET /user/:id endpoint logic
  async getUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  
  // handles PATCH /user/:id endpoint logic
  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  // handles DELETE /user/:id endpoint logic
  async deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  // get all users
  async findAll() {
    return this.prisma.user.findMany();
  }

  // search users
  async searchUsers(name: string) {
    return this.prisma.user.findMany({
      where: {
        displayName: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });
  }

  async letters() {
    return this.prisma.letter.findMany();
  }
}
