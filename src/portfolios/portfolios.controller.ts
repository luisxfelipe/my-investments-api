import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';
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
  @ApiOperation({ summary: 'Remove a portfolio by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Portfolio id' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async remove(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<void> {
    await this.portfoliosService.remove(+id, userId);
  }
}
