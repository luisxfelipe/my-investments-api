import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsInt, IsNotEmpty, IsOptional, IsPositive, Min } from "class-validator";

export class CreatePortfolioDto {
    @ApiProperty({ description: 'User ID' })
    @IsNotEmpty({ message: 'User ID is required' })
    @IsInt({ message: 'User ID must be an integer' })
    @IsPositive({ message: 'User ID must be a positive number' })
    userId: number;

    @ApiProperty({ description: 'Asset ID' })
    @IsNotEmpty({ message: 'Asset ID is required' })
    @IsInt({ message: 'Asset ID must be an integer' })
    @IsPositive({ message: 'Asset ID must be a positive number' })
    assetId: number;

    @ApiProperty({ description: 'Platform ID' })
    @IsNotEmpty({ message: 'Platform ID is required' })
    @IsInt({ message: 'Platform ID must be an integer' })
    @IsPositive({ message: 'Platform ID must be a positive number' })
    platformId: number;

    @ApiProperty({ description: 'Savings Goal ID', required: false })
    @IsOptional()
    @IsInt({ message: 'Savings Goal ID must be an integer' })
    @IsPositive({ message: 'Savings Goal ID must be a positive number' })
    savingsGoalId?: number;

    @ApiProperty({ description: 'Current Balance', default: 0 })
    @IsNotEmpty({ message: 'Current Balance is required' })
    @IsDecimal({ decimal_digits: '0,8' }, { message: 'Current Balance must be a decimal with up to 8 decimal places' })
    @Min(0, { message: 'Current Balance must be greater than or equal to 0' })
    currentBalance: number;

    @ApiProperty({ description: 'Average Price', default: 0 })
    @IsNotEmpty({ message: 'Average Price is required' })
    @IsDecimal({ decimal_digits: '0,8' }, { message: 'Average Price must be a decimal with up to 8 decimal places' })
    @Min(0, { message: 'Average Price must be greater than or equal to 0' })
    averagePrice: number;
}
