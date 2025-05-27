import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TransactionTypesService } from './transaction-types.service';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
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
  ): Promise<TransactionTypeResponseDto> {
    return new TransactionTypeResponseDto(
      await this.transactionTypesService.create(createTransactionTypeDto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all transaction types' })
  @ApiResponse({
    status: 200,
    description: 'List of all transaction types',
    type: [TransactionTypeResponseDto],
  })
  async findAll(): Promise<TransactionTypeResponseDto[]> {
    const transactionTypes = await this.transactionTypesService.findAll();
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
  async findOne(@Param('id') id: string): Promise<TransactionTypeResponseDto> {
    return new TransactionTypeResponseDto(
      await this.transactionTypesService.findOne(+id),
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
  ): Promise<TransactionTypeResponseDto> {
    return new TransactionTypeResponseDto(
      await this.transactionTypesService.update(+id, updateTransactionTypeDto),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a transaction type by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Transaction Type id' })
  @ApiResponse({
    status: 200,
    description: 'Transaction Type has been marked as successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Transaction Type not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.transactionTypesService.remove(+id);
  }
}
