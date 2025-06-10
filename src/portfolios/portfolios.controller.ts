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
  ParseIntPipe,
} from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';
import { PaginatedPortfolioResponseDto } from './dto/paginated-portfolio-response.dto';
import { UserDecorator } from '../decorators/user.decorator';

@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new portfolio' })
  @ApiResponse({
    status: 201,
    description: 'The portfolio has been successfully created',
    type: PortfolioResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid data or portfolio already exists for this user, asset and platform',
  })
  @ApiResponse({
    status: 404,
    description: 'User, Asset, Platform or Savings Goal not found',
  })
  async create(
    @Body() createPortfolioDto: CreatePortfolioDto,
    @UserDecorator() userId: number,
  ): Promise<PortfolioResponseDto> {
    return new PortfolioResponseDto(
      await this.portfoliosService.create(createPortfolioDto, userId),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all portfolios or filter by user' })
  @ApiResponse({
    status: 200,
    description: 'List of portfolios',
    type: [PortfolioResponseDto],
  })
  async findAll(
    @UserDecorator() userId: number,
  ): Promise<PortfolioResponseDto[]> {
    const portfolios = await this.portfoliosService.findAll(userId);

    return portfolios.map((portfolio) => new PortfolioResponseDto(portfolio));
  }

  @Get('pages')
  @ApiOperation({ summary: 'Find all portfolios with pagination' })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of portfolios',
    type: PaginatedPortfolioResponseDto,
  })
  async findAllWithPagination(
    @Query('take', new ParseIntPipe({ optional: true })) take = 10,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @UserDecorator() userId: number,
  ): Promise<PaginatedPortfolioResponseDto> {
    const paginatedPortfolios =
      await this.portfoliosService.findAllWithPagination(take, page, userId);

    const data = paginatedPortfolios.data.map(
      (portfolio) => new PortfolioResponseDto(portfolio),
    );

    return {
      data,
      meta: paginatedPortfolios.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one portfolio by id' })
  @ApiParam({ name: 'id', description: 'Portfolio id' })
  @ApiResponse({
    status: 200,
    description: 'The found portfolio',
    type: PortfolioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async findOne(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfoliosService.findOne(+id, userId);
    return new PortfolioResponseDto(portfolio);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a portfolio by id' })
  @ApiParam({ name: 'id', description: 'Portfolio id' })
  @ApiResponse({
    status: 200,
    description: 'The updated portfolio',
    type: PortfolioResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'No data provided for update or portfolio already exists for this user, asset and platform',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio, User, Asset, Platform or Savings Goal not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @UserDecorator() userId: number,
  ): Promise<PortfolioResponseDto> {
    return new PortfolioResponseDto(
      await this.portfoliosService.update(+id, updatePortfolioDto, userId),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a portfolio by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Portfolio id' })
  @ApiResponse({
    status: 204,
    description: 'Portfolio has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async remove(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<void> {
    await this.portfoliosService.remove(+id, userId);
  }

  /**
   * Remove a meta de economia de um portfolio
   */
  @Delete(':id/saving-goal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a saving goal from a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio id' })
  @ApiResponse({
    status: 200,
    description: 'The portfolio with saving goal removed',
    type: PortfolioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({
    status: 400,
    description: "Portfolio doesn't have a saving goal to remove",
  })
  async removeSavingGoal(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<PortfolioResponseDto> {
    return new PortfolioResponseDto(
      await this.portfoliosService.removeSavingGoal(+id, userId),
    );
  }

  @Get('platform/:platformId/pages')
  @ApiOperation({ summary: 'Find portfolios by platform with pagination' })
  @ApiParam({ name: 'platformId', description: 'Platform id' })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of portfolios from the specified platform',
    type: PaginatedPortfolioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async findByPlatformWithPagination(
    @Param('platformId') platformId: string,
    @Query('take', new ParseIntPipe({ optional: true })) take = 10,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @UserDecorator() userId: number,
  ): Promise<PaginatedPortfolioResponseDto> {
    const paginatedPortfolios =
      await this.portfoliosService.findByPlatformWithPagination(
        +platformId,
        take,
        page,
        userId,
      );

    const data = paginatedPortfolios.data.map(
      (portfolio) => new PortfolioResponseDto(portfolio),
    );

    return {
      data,
      meta: paginatedPortfolios.meta,
    };
  }
}
