import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoryResponseDto } from './dto/category-response.dto';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';
import { PaginatedCategoryResponseDto } from './dto/paginated-category-response.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or category name already exists',
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return new CategoryResponseDto(
      await this.categoriesService.create(createCategoryDto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all categories' })
  @ApiResponse({
    status: 200,
    description: 'List of all categories',
    type: [CategoryResponseDto],
  })
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesService.findAll();
    return categories.map((category) => new CategoryResponseDto(category));
  }

  @Get('pages')
  @ApiOperation({ summary: 'Find all categories with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Items per page',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of categories',
    type: PaginatedCategoryResponseDto,
  })
  async findAllWithPagination(
    @Query('take') take: string = '10',
    @Query('page') page: string = '1',
  ): Promise<PaginatedResponseDto<CategoryResponseDto>> {
    const takeNumber = parseInt(take);
    const pageNumber = parseInt(page);

    const categories = await this.categoriesService.findAllWithPagination(
      takeNumber,
      pageNumber,
    );

    // Transformar as categorias em DTOs de resposta
    const categoryDtos = categories.data.map(
      (category) => new CategoryResponseDto(category),
    );

    // Retornar o objeto PaginatedResponseDto com os dados transformados
    return new PaginatedResponseDto<CategoryResponseDto>(
      categoryDtos,
      categories.meta.totalItems,
      categories.meta.itemsPerPage,
      categories.meta.currentPage,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one category by id' })
  @ApiParam({ name: 'id', description: 'Category id' })
  @ApiResponse({
    status: 200,
    description: 'The found category',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    return new CategoryResponseDto(await this.categoriesService.findOne(+id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category by id' })
  @ApiParam({ name: 'id', description: 'Category id' })
  @ApiResponse({
    status: 200,
    description: 'The updated category',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No data provided for update or category name already exists',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return new CategoryResponseDto(
      await this.categoriesService.update(+id, updateCategoryDto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a category by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Category id' })
  @ApiResponse({
    status: 204,
    description: 'Category has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.categoriesService.remove(+id);
  }
}
