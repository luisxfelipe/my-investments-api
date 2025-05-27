import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SavingGoalResponseDto } from './dto/saving-goal-response.dto';

@Controller('savings-goals')
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
  ): Promise<SavingGoalResponseDto> {
    return new SavingGoalResponseDto(
      await this.savingsGoalsService.create(createSavingGoalDto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all savings goals' })
  @ApiResponse({
    status: 200,
    description: 'List of all savings goals',
    type: [SavingGoalResponseDto],
  })
  async findAll(): Promise<SavingGoalResponseDto[]> {
    const savingsGoals = await this.savingsGoalsService.findAll();
    return savingsGoals.map(
      (savingsGoal) => new SavingGoalResponseDto(savingsGoal),
    );
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
  async findOne(@Param('id') id: string): Promise<SavingGoalResponseDto> {
    return new SavingGoalResponseDto(
      await this.savingsGoalsService.findOne(+id),
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
  ): Promise<SavingGoalResponseDto> {
    return new SavingGoalResponseDto(
      await this.savingsGoalsService.update(+id, updateSavingGoalDto),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a savings goal by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Savings Goal id' })
  @ApiResponse({
    status: 200,
    description: 'Savings Goal has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Savings Goal not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.savingsGoalsService.remove(+id);
  }
}
