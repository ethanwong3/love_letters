//  decorators for defining routes and types of data in http requests
import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
// DTOs for validating and typing request bodies
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// user endpoints
@Controller('user')
export class UserController {
		// inject UserService to delegate business logic
    constructor(private readonly userService: UserService) {}

		// map this method to POST /user endpoint
    @Post()
		// extracts the request body and validates it against the CreateUserDto
    async createUser(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto);
    }

		// map this method to GET /user/:id endpoint
    @Get(':id')
		// extracts the id parameter from the URL
    async getUserById(@Param('id') id: string) {
        return this.userService.getUserById(id);
    }

		// map this method to PATCH /user/:id endpoint
    @Patch(':id')
		// extracts the id parameter and request body, validating the body against UpdateUserDto
    async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUser(id, updateUserDto);
    }

		// map this method to DELETE /user/:id endpoint
    @Delete(':id')
		// extracts the id parameter from the URL
    async deleteUser(@Param('id') id: string) {
        return this.userService.deleteUser(id);
    }

    // get all users
    @Get()
    findAll() {
      return this.userService.findAll();
    }
}
