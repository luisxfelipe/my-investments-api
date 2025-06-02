import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AssetTypesService } from './asset-types.service';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AssetTypeResponseDto } from './dto/asset-type-response.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';

@Controller('asset-types')
export class AssetTypesController {
  constructor(private readonly assetTypesService: AssetTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new asset type' })
  @ApiResponse({
    status: 201,
    description: 'The asset type has been successfully created',
    type: AssetTypeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or asset type name already exists',
  })
  async create(
    @Body() createAssetTypeDto: CreateAssetTypeDto,
  ): Promise<AssetTypeResponseDto> {
    return new AssetTypeResponseDto(
      await this.assetTypesService.create(createAssetTypeDto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all asset types' })
  @ApiResponse({
    status: 200,
    description: 'List of all asset types',
    type: [AssetTypeResponseDto],
  })
  async findAll(): Promise<AssetTypeResponseDto[]> {
    const assetTypes = await this.assetTypesService.findAll();
    return assetTypes.map((assetType) => new AssetTypeResponseDto(assetType));
  }

  @Get('pages')
  @ApiOperation({ summary: 'Find all asset types with pagination' })
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
    description: 'Paginated list of asset types',
    type: PaginatedResponseDto,
  })
  async findAllWithPagination(
    @Query('take') take: string = '10',
    @Query('page') page: string = '1',
  ): Promise<PaginatedResponseDto<AssetTypeResponseDto>> {
    const takeNumber = parseInt(take);
    const pageNumber = parseInt(page);

    const assetTypes = await this.assetTypesService.findAllWithPagination(
      takeNumber,
      pageNumber,
    );

    // Transformar os asset types em DTOs de resposta
    const assetTypeDtos = assetTypes.data.map(
      (assetType) => new AssetTypeResponseDto(assetType),
    );

    // Retornar o objeto PaginatedResponseDto com os dados transformados
    return new PaginatedResponseDto<AssetTypeResponseDto>(
      assetTypeDtos,
      assetTypes.meta.totalItems,
      assetTypes.meta.itemsPerPage,
      assetTypes.meta.currentPage,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one asset type by id' })
  @ApiParam({ name: 'id', description: 'Asset Type id' })
  @ApiResponse({
    status: 200,
    description: 'The found asset type',
    type: AssetTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Asset Type not found' })
  async findOne(@Param('id') id: string): Promise<AssetTypeResponseDto> {
    return new AssetTypeResponseDto(await this.assetTypesService.findOne(+id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an asset type by id' })
  @ApiParam({ name: 'id', description: 'Asset Type id' })
  @ApiResponse({
    status: 200,
    description: 'The updated asset type',
    type: AssetTypeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'No data provided for update or asset type name already exists',
  })
  @ApiResponse({ status: 404, description: 'Asset Type not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAssetTypeDto: UpdateAssetTypeDto,
  ): Promise<AssetTypeResponseDto> {
    return new AssetTypeResponseDto(
      await this.assetTypesService.update(+id, updateAssetTypeDto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an asset type by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Asset Type id' })
  @ApiResponse({
    status: 204,
    description: 'Asset Type has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Asset Type not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.assetTypesService.remove(+id);
  }
}
