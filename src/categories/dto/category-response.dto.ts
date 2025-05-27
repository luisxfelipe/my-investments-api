import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: number;

  @ApiProperty({ description: 'Category Name' })
  name: string;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
  }
}
