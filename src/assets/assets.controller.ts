import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AssetResponseDto } from './dto/asset-response.dto';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({ status: 201, description: 'The asset has been successfully created', type: AssetResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Category, Asset Type or Platform not found' })
  async create(@Body() createAssetDto: CreateAssetDto): Promise<AssetResponseDto> {
    return new AssetResponseDto(await this.assetsService.create(createAssetDto));
  }

  @Get()
  @ApiOperation({ summary: 'Find all assets' })
  @ApiResponse({ status: 200, description: 'List of all assets', type: [AssetResponseDto] })
  async findAll(): Promise<AssetResponseDto[]> {
    const assets = await this.assetsService.findAll();
    return assets.map(asset => new AssetResponseDto(asset));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one asset by id' })
  @ApiParam({ name: 'id', description: 'Asset id' })
  @ApiResponse({ status: 200, description: 'The found asset', type: AssetResponseDto })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(@Param('id') id: string): Promise<AssetResponseDto> {
    return new AssetResponseDto(await this.assetsService.findOne(+id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an asset by id' })
  @ApiParam({ name: 'id', description: 'Asset id' })
  @ApiResponse({ status: 200, description: 'The updated asset', type: AssetResponseDto })
  @ApiResponse({ status: 400, description: 'No data provided for update' })
  @ApiResponse({ status: 404, description: 'Asset, Category, Asset Type or Platform not found' })
  async update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto): Promise<AssetResponseDto> {
    return new AssetResponseDto(await this.assetsService.update(+id, updateAssetDto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an asset by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Asset id' })
  @ApiResponse({ status: 200, description: 'Asset has been marked as successfully removed' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.assetsService.remove(+id);
  }
}
