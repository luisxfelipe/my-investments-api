import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from "class-validator";

export class CreateAssetDto {
    @ApiProperty({ description: 'Name of the asset' })
    @IsNotEmpty({ message: 'Name is required' })
    @IsString({ message: 'Name must be a string' })
    @MaxLength(100, { message: 'Name must be at most 100 characters long' })
    name: string;

    @ApiProperty({ description: 'Code of the asset', required: false })
    @IsOptional()
    @IsString({ message: 'Code must be a string' })
    @MaxLength(20, { message: 'Code must be at most 20 characters long' })
    code?: string;

    @ApiProperty({ description: 'Category ID' })
    @IsNotEmpty({ message: 'Category ID is required' })
    @IsInt({ message: 'Category ID must be an integer' })
    @IsPositive({ message: 'Category ID must be a positive number' })
    categoryId: number;

    @ApiProperty({ description: 'Asset Type ID' })
    @IsNotEmpty({ message: 'Asset Type ID is required' })
    @IsInt({ message: 'Asset Type ID must be an integer' })
    @IsPositive({ message: 'Asset Type ID must be a positive number' })
    assetTypeId: number;
}
