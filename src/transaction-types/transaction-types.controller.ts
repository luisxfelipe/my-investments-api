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
} from '@nestjs/common';
import { TransactionTypesService } from './transaction-types.service';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UserDecorator } from 'src/decorators/user.decorator';
import { TransactionTypeResponseDto } from './dto/transaction-type-response.dto';

@Controller('transaction-types')
export class TransactionTypesController {
  constructor(
    private readonly transactionTypesService: TransactionTypesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction type' })
  @ApiResponse({
    status: 201,
    description: 'The transaction type has been successfully created',
    type: TransactionTypeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or transaction type name already exists',
  })
  async create(
    @Body() createTransactionTypeDto: CreateTransactionTypeDto,
    @UserDecorator() userId: number,
  ): Promise<TransactionTypeResponseDto> {
    return new TransactionTypeResponseDto(
      await this.transactionTypesService.create(
        createTransactionTypeDto,
        userId,
      ),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all transaction types' })
  @ApiResponse({
    status: 200,
    description: 'List of all transaction types',
    type: [TransactionTypeResponseDto],
  })
  async findAll(
    @UserDecorator() userId: number,
  ): Promise<TransactionTypeResponseDto[]> {
    const transactionTypes = await this.transactionTypesService.findAll(userId);
    return transactionTypes.map(
      (transactionType) => new TransactionTypeResponseDto(transactionType),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one transaction type by id' })
  @ApiParam({ name: 'id', description: 'Transaction Type id' })
  @ApiResponse({
    status: 200,
    description: 'The found transaction type',
    type: TransactionTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction Type not found' })
  async findOne(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<TransactionTypeResponseDto> {
    return new TransactionTypeResponseDto(
      await this.transactionTypesService.findOne(+id, userId),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction type by id' })
  @ApiParam({ name: 'id', description: 'Transaction Type id' })
  @ApiResponse({
    status: 200,
    description: 'The updated transaction type',
    type: TransactionTypeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'No data provided for update or transaction type name already exists',
  })
  @ApiResponse({ status: 404, description: 'Transaction Type not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTransactionTypeDto: UpdateTransactionTypeDto,
    @UserDecorator() userId: number,
  ): Promise<TransactionTypeResponseDto> {
    return new TransactionTypeResponseDto(
      await this.transactionTypesService.update(
        +id,
        updateTransactionTypeDto,
        userId,
      ),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a transaction type by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Transaction Type id' })
  @ApiResponse({
    status: 204,
    description: 'Transaction Type has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Transaction Type not found' })
  async remove(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<void> {
    await this.transactionTypesService.remove(+id, userId);
  }
}
