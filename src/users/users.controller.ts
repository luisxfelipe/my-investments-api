import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { Public } from 'src/decorators/is-public.decorator';
import { UserDecorator } from 'src/decorators/user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // deixar o endpoint de criação de usuário aberto para testes
  @Public()
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

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({
    status: 200,
    description: 'The current user profile',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMyProfile(
    @UserDecorator() userId: number,
  ): Promise<UserResponseDto> {
    return new UserResponseDto(await this.usersService.findOne(userId));
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile (name and email only)' })
  @ApiResponse({
    status: 200,
    description: 'The updated user profile',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateMyProfile(
    @Body() updateUserDto: UpdateUserDto,
    @UserDecorator() userId: number,
  ): Promise<UserResponseDto> {
    return new UserResponseDto(
      await this.usersService.updateProfile(userId, updateUserDto),
    );
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change my password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid current password or data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changeMyPassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @UserDecorator() userId: number,
  ): Promise<{ message: string }> {
    await this.usersService.changePassword(userId, changePasswordDto);
    return { message: 'Password changed successfully' };
  }
}
