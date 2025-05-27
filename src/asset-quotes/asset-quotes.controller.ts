import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AssetQuotesService } from './asset-quotes.service';
import { CreateAssetQuoteDto } from './dto/create-asset-quote.dto';
import { AssetQuoteResponseDto } from './dto/asset-quote-response.dto';
import { PaginatedAssetQuoteResponseDto } from './dto/paginated-asset-quote-response.dto';
import { UpdateAssetQuoteDto } from './dto/update-asset-quote.dto';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';

@ApiTags('asset-quotes')
@Controller('asset-quotes')
export class AssetQuotesController {
  constructor(private readonly assetQuotesService: AssetQuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quote for an asset' })
  @ApiResponse({
    status: 201,
    description: 'Quote successfully created',
    type: AssetQuoteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async create(
    @Body() createAssetQuoteDto: CreateAssetQuoteDto,
  ): Promise<AssetQuoteResponseDto> {
    const quote = await this.assetQuotesService.create(createAssetQuoteDto);
    return new AssetQuoteResponseDto(quote);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest quote for an asset' })
  @ApiQuery({
    name: 'assetId',
    required: true,
    description: 'Asset ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Latest quote found',
    type: AssetQuoteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found for the asset provided.',
  })
  async findLatest(
    @Query('assetId') assetId: string,
  ): Promise<AssetQuoteResponseDto> {
    const quote = await this.assetQuotesService.findLatestByAssetId(
      Number(assetId),
    );
    return new AssetQuoteResponseDto(quote);
  }

  @Get('latest/all')
  @ApiOperation({ summary: 'Get the latest quote for all assets' })
  @ApiResponse({
    status: 200,
    description: 'Latest quotes for all assets',
    type: [AssetQuoteResponseDto],
  })
  async findLatestForAllAssets(): Promise<AssetQuoteResponseDto[]> {
    const quotes = await this.assetQuotesService.findLatestForAllAssets();
    return quotes.map((q) => new AssetQuoteResponseDto(q));
  }

  @Get('latest/all/pages')
  @ApiOperation({ summary: 'Get the latest quote for all assets (paginated)' })
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
    description: 'Paginated list of latest quotes for all assets',
    type: PaginatedAssetQuoteResponseDto,
  })
  async findLatestForAllAssetsWithPagination(
    @Query('take') take?: string,
    @Query('page') page?: string,
  ) {
    const takeNumber = take ? parseInt(take) : 10;
    const pageNumber = page ? parseInt(page) : 1;
    const quotes =
      await this.assetQuotesService.findLatestForAllAssetsWithPagination(
        takeNumber,
        pageNumber,
      );
    const quoteDtos = quotes.data.map((q) => new AssetQuoteResponseDto(q));
    return new PaginatedResponseDto<AssetQuoteResponseDto>(
      quoteDtos,
      quotes.meta.totalItems,
      quotes.meta.itemsPerPage,
      quotes.meta.currentPage,
    );
  }

  @Get('history/:assetId')
  @ApiOperation({ summary: 'Get quote history for an asset' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote history',
    type: [AssetQuoteResponseDto],
  })
  @ApiResponse({ status: 404, description: 'No quotes found for the asset.' })
  async findAllByAssetId(
    @Param('assetId') assetId: string,
  ): Promise<AssetQuoteResponseDto[]> {
    const quotes = await this.assetQuotesService.findAllByAssetId(
      Number(assetId),
    );
    return quotes.map((q) => new AssetQuoteResponseDto(q));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quote by ID' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote found',
    type: AssetQuoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Quote not found.' })
  async findOne(@Param('id') id: string): Promise<AssetQuoteResponseDto> {
    const quote = await this.assetQuotesService.findOne(Number(id));
    return new AssetQuoteResponseDto(quote);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quote by ID' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote updated',
    type: AssetQuoteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No data provided for update' })
  @ApiResponse({ status: 404, description: 'Quote not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateAssetQuoteDto,
  ): Promise<AssetQuoteResponseDto> {
    const updated = await this.assetQuotesService.update(
      Number(id),
      updateData,
    );
    return new AssetQuoteResponseDto(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quote by ID (soft delete)' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({
    status: 200,
    description: 'Quote has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Quote not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.assetQuotesService.delete(Number(id));
  }
}
