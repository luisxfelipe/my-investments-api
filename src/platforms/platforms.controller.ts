import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlatformResponseDto } from './dto/platform-response.dto';

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
