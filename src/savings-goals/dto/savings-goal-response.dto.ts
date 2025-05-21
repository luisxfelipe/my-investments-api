import { UserResponseDto } from "src/users/dto/user-response.dto";
import { SavingsGoal } from "../entities/savings-goal.entity";
import { ApiProperty } from "@nestjs/swagger";

export class SavingsGoalResponseDto {
    @ApiProperty({ description: 'Savings Goal ID' })
    id: number;

    @ApiProperty({ description: 'User ID' })
    userId: number;

    @ApiProperty({ description: 'Savings Goal Name' })
    name: string;

    @ApiProperty({ description: 'Savings Goal Description', required: false })
    description?: string;

    @ApiProperty({ description: 'Target Value', required: false })
    targetValue?: number;

    @ApiProperty({ description: 'Target Date', required: false })
    targetDate?: Date;

    @ApiProperty({ description: 'User', type: UserResponseDto })
    user?: UserResponseDto;

    constructor(savingsGoal: SavingsGoal) {
        this.id = savingsGoal.id;
        this.userId = savingsGoal.userId;
        this.name = savingsGoal.name;
        this.description = savingsGoal.description;
        this.targetValue = savingsGoal.targetValue;
        this.targetDate = savingsGoal.targetDate;

        if (savingsGoal.user) {
            this.user = new UserResponseDto(savingsGoal.user);
        }
    }
}