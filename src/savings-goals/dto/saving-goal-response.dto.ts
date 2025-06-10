import { SavingGoal } from '../entities/saving-goal.entity';
import { ApiProperty } from '@nestjs/swagger';

export class SavingGoalResponseDto {
  @ApiProperty({ description: 'Savings Goal ID' })
  id: number;

  @ApiProperty({ description: 'Savings Goal Name' })
  name: string;

  @ApiProperty({ description: 'Savings Goal Description', required: false })
  description?: string;

  @ApiProperty({ description: 'Target Value', required: false })
  targetValue?: number;

  @ApiProperty({ description: 'Target Date', required: false })
  targetDate?: Date;

  constructor(savingGoal: SavingGoal) {
    this.id = savingGoal.id;
    this.name = savingGoal.name;
    this.description = savingGoal.description;
    this.targetValue = savingGoal.targetValue;
    this.targetDate = savingGoal.targetDate;
  }
}
