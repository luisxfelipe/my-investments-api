import { UserResponseDto } from "src/users/dto/user-response.dto";
import { SavingGoal } from "../entities/saving-goal.entity";
import { ApiProperty } from "@nestjs/swagger";

export class SavingGoalResponseDto {
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

    constructor(savingGoal: SavingGoal) {
        this.id = savingGoal.id;
        this.userId = savingGoal.userId;
        this.name = savingGoal.name;
        this.description = savingGoal.description;
        this.targetValue = savingGoal.targetValue;
        this.targetDate = savingGoal.targetDate;

        if (savingGoal.user) {
            this.user = new UserResponseDto(savingGoal.user);
        }
    }
}