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
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AssetResponseDto } from './dto/asset-response.dto';
import { UserDecorator } from '../decorators/user.decorator';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';
import { PaginatedAssetResponseDto } from './dto/paginated-asset-response.dto';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({
    status: 201,
    description: 'The asset has been successfully created',
    type: AssetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({
    status: 404,
    description: 'Category, Asset Type or Platform not found',
  })
  async create(
    @UserDecorator() userId: number,
    @Body() createAssetDto: CreateAssetDto,
  ): Promise<AssetResponseDto> {
    return new AssetResponseDto(
      await this.assetsService.create(userId, createAssetDto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all assets' })
  @ApiResponse({
    status: 200,
    description: 'List of all assets',
    type: [AssetResponseDto],
  })
  async findAll(@UserDecorator() userId: number): Promise<AssetResponseDto[]> {
    const assets = await this.assetsService.findAll(userId);
    return assets.map((asset) => new AssetResponseDto(asset));
  }

  @Get('pages')
  @ApiOperation({ summary: 'Find all assets with pagination' })
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
    description: 'Paginated list of assets',
    type: PaginatedAssetResponseDto,
  })
  async findAllWithPagination(
    @UserDecorator() userId: number,
    @Query('take') take: string = '10',
    @Query('page') page: string = '1',
  ): Promise<PaginatedResponseDto<AssetResponseDto>> {
    const takeNumber = parseInt(take);
    const pageNumber = parseInt(page);

    const assets = await this.assetsService.findAllWithPagination(
      takeNumber,
      pageNumber,
      userId,
    );

    // Transformar os assets em DTOs de resposta
    const assetDtos = assets.data.map((asset) => new AssetResponseDto(asset));

    // Retornar o objeto PaginatedResponseDto com os dados transformados
    return new PaginatedResponseDto<AssetResponseDto>(
      assetDtos,
      assets.meta.totalItems,
      assets.meta.itemsPerPage,
      assets.meta.currentPage,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one asset by id' })
  @ApiParam({ name: 'id', description: 'Asset id' })
  @ApiResponse({
    status: 200,
    description: 'The found asset',
    type: AssetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<AssetResponseDto> {
    return new AssetResponseDto(await this.assetsService.findOne(+id, userId));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an asset by id' })
  @ApiParam({ name: 'id', description: 'Asset id' })
  @ApiResponse({
    status: 200,
    description: 'The updated asset',
    type: AssetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No data provided for update' })
  @ApiResponse({
    status: 404,
    description: 'Asset, Category, Asset Type or Platform not found',
  })
  async update(
    @Param('id') id: string,
    @UserDecorator() userId: number,
    @Body() updateAssetDto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    return new AssetResponseDto(
      await this.assetsService.update(+id, userId, updateAssetDto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an asset by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Asset id' })
  @ApiResponse({
    status: 204,
    description: 'Asset has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async remove(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<void> {
    await this.assetsService.remove(+id, userId);
  }
}
