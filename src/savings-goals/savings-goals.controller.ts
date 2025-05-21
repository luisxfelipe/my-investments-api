import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SavingsGoalResponseDto } from './dto/savings-goal-response.dto';

@Controller('savings-goals')
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new savings goal' })
  @ApiResponse({ status: 201, description: 'The savings goal has been successfully created', type: SavingsGoalResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async create(@Body() createSavingsGoalDto: CreateSavingsGoalDto): Promise<SavingsGoalResponseDto> {
    return new SavingsGoalResponseDto(await this.savingsGoalsService.create(createSavingsGoalDto));
  }

  @Get()
  @ApiOperation({ summary: 'Find all savings goals' })
  @ApiResponse({ status: 200, description: 'List of all savings goals', type: [SavingsGoalResponseDto] })
  async findAll(): Promise<SavingsGoalResponseDto[]> {
    const savingsGoals = await this.savingsGoalsService.findAll();
    return savingsGoals.map(savingsGoal => new SavingsGoalResponseDto(savingsGoal));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one savings goal by id' })
  @ApiParam({ name: 'id', description: 'Savings Goal id' })
  @ApiResponse({ status: 200, description: 'The found savings goal', type: SavingsGoalResponseDto })
  @ApiResponse({ status: 404, description: 'Savings Goal not found' })
  async findOne(@Param('id') id: string): Promise<SavingsGoalResponseDto> {
    return new SavingsGoalResponseDto(await this.savingsGoalsService.findOne(+id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a savings goal by id' })
  @ApiParam({ name: 'id', description: 'Savings Goal id' })
  @ApiResponse({ status: 200, description: 'The updated savings goal', type: SavingsGoalResponseDto })
  @ApiResponse({ status: 400, description: 'No data provided for update' })
  @ApiResponse({ status: 404, description: 'Savings Goal or User not found' })
  async update(@Param('id') id: string, @Body() updateSavingsGoalDto: UpdateSavingsGoalDto): Promise<SavingsGoalResponseDto> {
    return new SavingsGoalResponseDto(await this.savingsGoalsService.update(+id, updateSavingsGoalDto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a savings goal by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Savings Goal id' })
  @ApiResponse({ status: 200, description: 'Savings Goal has been marked as successfully removed' })
  @ApiResponse({ status: 404, description: 'Savings Goal not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.savingsGoalsService.remove(+id);
  }
}
