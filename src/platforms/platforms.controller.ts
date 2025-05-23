import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { PlatformResponseDto } from './dto/platform-response.dto';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';

@ApiTags('platforms')
@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new platform' })
  @ApiResponse({ status: 201, description: 'The platform has been successfully created', type: PlatformResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data or platform name already exists' })
  async create(@Body() createPlatformDto: CreatePlatformDto): Promise<PlatformResponseDto> {
    return new PlatformResponseDto(await this.platformsService.create(createPlatformDto));
  }

  @Get()
  @ApiOperation({ summary: 'Find all platforms' })
  @ApiResponse({ status: 200, description: 'List of all platforms', type: [PlatformResponseDto] })
  async findAll(): Promise<PlatformResponseDto[]> {
    const platforms = await this.platformsService.findAll();
    return platforms.map(platform => new PlatformResponseDto(platform));
  }

  @Get('pages')
  @ApiOperation({ summary: 'Find all platforms with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'take', required: false, description: 'Items per page', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of platforms',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(PlatformResponseDto) }
        },
        total: { type: 'number', example: 100 },
      }
    }
  })
  async findAllWithPagination(
    @Query('take') take?: string,
    @Query('page') page?: string,
  ): Promise<PaginatedResponseDto<PlatformResponseDto>> {
    const takeNumber = take ? parseInt(take) : 10;
    const pageNumber = page ? parseInt(page) : 1;

    const platforms = await this.platformsService.findAllWithPagination(
      takeNumber,
      pageNumber,
    );

    // Transformar as plataformas em DTOs de resposta
    const platformDtos = platforms.data.map(
      platform => new PlatformResponseDto(platform)
    );

    // Retornar o objeto PaginatedResponseDto com os dados transformados
    return new PaginatedResponseDto<PlatformResponseDto>(
      platformDtos,
      platforms.total
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one platform by id' })
  @ApiParam({ name: 'id', description: 'Platform id' })
  @ApiResponse({ status: 200, description: 'The found platform', type: PlatformResponseDto })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async findOne(@Param('id') id: string): Promise<PlatformResponseDto> {
    return new PlatformResponseDto(await this.platformsService.findOne(+id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a platform by id' })
  @ApiParam({ name: 'id', description: 'Platform id' })
  @ApiResponse({ status: 200, description: 'The updated platform', type: PlatformResponseDto })
  @ApiResponse({ status: 400, description: 'No data provided for update or platform name already exists' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async update(@Param('id') id: string, @Body() updatePlatformDto: UpdatePlatformDto): Promise<PlatformResponseDto> {
    return new PlatformResponseDto(await this.platformsService.update(+id, updatePlatformDto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a platform by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Platform id' })
  @ApiResponse({ status: 200, description: 'Platform has been marked as successfully removed' })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.platformsService.remove(+id);
  }
}
