import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserDecorator } from 'src/decorators/user.decorator';
import { SavingGoalResponseDto } from './dto/saving-goal-response.dto';
import { PaginatedSavingGoalResponseDto } from './dto/paginated-saving-goal-response.dto';

@Controller('saving-goals')
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new savings goal' })
  @ApiResponse({
    status: 201,
    description: 'The savings goal has been successfully created',
    type: SavingGoalResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async create(
    @Body() createSavingGoalDto: CreateSavingGoalDto,
    @UserDecorator() userId: number,
  ): Promise<SavingGoalResponseDto> {
    return new SavingGoalResponseDto(
      await this.savingsGoalsService.create(createSavingGoalDto, userId),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all savings goals' })
  @ApiResponse({
    status: 200,
    description: 'List of all savings goals',
    type: [SavingGoalResponseDto],
  })
  async findAll(
    @UserDecorator() userId: number,
  ): Promise<SavingGoalResponseDto[]> {
    const savingsGoals = await this.savingsGoalsService.findAll(userId);
    return savingsGoals.map(
      (savingsGoal) => new SavingGoalResponseDto(savingsGoal),
    );
  }

  @Get('pages')
  @ApiOperation({ summary: 'Find all savings goals with pagination' })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of savings goals',
    type: PaginatedSavingGoalResponseDto,
  })
  async findAllWithPagination(
    @Query('take', new ParseIntPipe({ optional: true })) take = 10,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @UserDecorator() userId: number,
  ): Promise<PaginatedSavingGoalResponseDto> {
    const paginated = await this.savingsGoalsService.findAllWithPagination(
      take,
      page,
      userId,
    );
    const data = paginated.data.map((goal) => new SavingGoalResponseDto(goal));
    return {
      data,
      meta: paginated.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one savings goal by id' })
  @ApiParam({ name: 'id', description: 'Savings Goal id' })
  @ApiResponse({
    status: 200,
    description: 'The found savings goal',
    type: SavingGoalResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Savings Goal not found' })
  async findOne(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<SavingGoalResponseDto> {
    return new SavingGoalResponseDto(
      await this.savingsGoalsService.findOne(+id, userId),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a savings goal by id' })
  @ApiParam({ name: 'id', description: 'Savings Goal id' })
  @ApiResponse({
    status: 200,
    description: 'The updated savings goal',
    type: SavingGoalResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No data provided for update' })
  @ApiResponse({ status: 404, description: 'Savings Goal or User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSavingGoalDto: UpdateSavingGoalDto,
    @UserDecorator() userId: number,
  ): Promise<SavingGoalResponseDto> {
    return new SavingGoalResponseDto(
      await this.savingsGoalsService.update(+id, updateSavingGoalDto, userId),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a savings goal by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Savings Goal id' })
  @ApiResponse({
    status: 204,
    description: 'Savings Goal has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Savings Goal not found' })
  @ApiResponse({
    status: 400,
    description: 'Savings Goal is in use by portfolios',
  })
  async remove(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<void> {
    await this.savingsGoalsService.remove(+id, userId);
  }
}
