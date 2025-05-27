import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return new UserResponseDto(await this.usersService.create(createUserDto));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one user by id' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiResponse({
    status: 200,
    description: 'The found user',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return new UserResponseDto(await this.usersService.findOne(+id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by id' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiResponse({ status: 200, description: 'The updated user', type: User })
  @ApiResponse({ status: 400, description: 'No data provided for update' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return new UserResponseDto(
      await this.usersService.update(+id, updateUserDto || {}),
    );
  }
}
