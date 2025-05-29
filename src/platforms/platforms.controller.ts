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
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlatformResponseDto } from './dto/platform-response.dto';
import { UserDecorator } from 'src/decorators/user.decorator';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';
import { PaginatedPlatformResponseDto } from './dto/paginated-platform-response.dto';
import { PaginatedPlatformAssetsResponseDto } from './dto/paginated-platform-assets-response.dto';
import { PlatformDashboardResponseDto } from './dto/platform-dashboard-response.dto';

@ApiTags('platforms')
@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new platform' })
  @ApiResponse({
    status: 201,
    description: 'The platform has been successfully created',
    type: PlatformResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or platform name already exists',
  })
  async create(
    @Body() createPlatformDto: CreatePlatformDto,
    @UserDecorator() userId: number,
  ): Promise<PlatformResponseDto> {
    return new PlatformResponseDto(
      await this.platformsService.create(createPlatformDto, userId),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all platforms' })
  @ApiResponse({
    status: 200,
    description: 'List of all platforms',
    type: [PlatformResponseDto],
  })
  async findAll(
    @UserDecorator() userId: number,
  ): Promise<PlatformResponseDto[]> {
    const platforms = await this.platformsService.findAll(userId);
    return platforms.map((platform) => new PlatformResponseDto(platform));
  }

  @Get('pages')
  @ApiOperation({ summary: 'Find all platforms with pagination' })
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
    description: 'Paginated list of platforms',
    type: PaginatedPlatformResponseDto,
  })
  async findAllWithPagination(
    @UserDecorator() userId: number,
    @Query('take') take: string = '10',
    @Query('page') page: string = '1',
  ): Promise<PaginatedResponseDto<PlatformResponseDto>> {
    const takeNumber = parseInt(take);
    const pageNumber = parseInt(page);

    const platforms = await this.platformsService.findAllWithPagination(
      takeNumber,
      pageNumber,
      userId,
    );

    // Transformar as plataformas em DTOs de resposta
    const platformDtos = platforms.data.map(
      (platform) => new PlatformResponseDto(platform),
    );

    // Retornar o objeto PaginatedResponseDto com os dados transformados
    return new PaginatedResponseDto<PlatformResponseDto>(
      platformDtos,
      platforms.meta.totalItems,
      platforms.meta.itemsPerPage,
      platforms.meta.currentPage,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one platform by id' })
  @ApiParam({ name: 'id', description: 'Platform id' })
  @ApiResponse({
    status: 200,
    description: 'The found platform',
    type: PlatformResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async findOne(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<PlatformResponseDto> {
    return new PlatformResponseDto(
      await this.platformsService.findOne(+id, userId),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a platform by id' })
  @ApiParam({ name: 'id', description: 'Platform id' })
  @ApiResponse({
    status: 200,
    description: 'The updated platform',
    type: PlatformResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No data provided for update or platform name already exists',
  })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePlatformDto: UpdatePlatformDto,
    @UserDecorator() userId: number,
  ): Promise<PlatformResponseDto> {
    return new PlatformResponseDto(
      await this.platformsService.update(+id, updatePlatformDto, userId),
    );
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a platform by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Platform id' })
  @ApiResponse({
    status: 204,
    description: 'Platform has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async remove(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<void> {
    await this.platformsService.remove(+id, userId);
  }

  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Get platform investment dashboard summary' })
  @ApiParam({ name: 'id', description: 'Platform id' })
  @ApiResponse({
    status: 200,
    description: 'Platform dashboard summary',
    type: PlatformDashboardResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async getPlatformDashboard(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<PlatformDashboardResponseDto> {
    return await this.platformsService.getPlatformDashboard(+id, userId);
  }

  @Get(':id/assets')
  @ApiOperation({ summary: 'Get platform assets with pagination' })
  @ApiParam({ name: 'id', description: 'Platform id' })
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
    description: 'Paginated list of platform assets',
    type: PaginatedPlatformAssetsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async getPlatformAssets(
    @Param('id') id: string,
    @UserDecorator() userId: number,
    @Query('take') take: string = '10',
    @Query('page') page: string = '1',
  ): Promise<PaginatedPlatformAssetsResponseDto> {
    const takeNumber = parseInt(take);
    const pageNumber = parseInt(page);

    return await this.platformsService.getPlatformAssets(
      +id,
      userId,
      takeNumber,
      pageNumber,
    );
  }
}
