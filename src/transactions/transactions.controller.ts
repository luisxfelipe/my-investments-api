import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'The transaction has been successfully created', type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Portfolio or Transaction Type not found' })
  async create(@Body() createTransactionDto: CreateTransactionDto): Promise<TransactionResponseDto> {
    return new TransactionResponseDto(await this.transactionsService.create(createTransactionDto));
  }

  @Get()
  @ApiOperation({ summary: 'Find all transactions' })
  @ApiResponse({ status: 200, description: 'List of all transactions', type: [TransactionResponseDto] })
  async findAll(): Promise<TransactionResponseDto[]> {
    const transactions = await this.transactionsService.findAll();
    return transactions.map(transaction => new TransactionResponseDto(transaction));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one transaction by id' })
  @ApiParam({ name: 'id', description: 'Transaction id' })
  @ApiResponse({ status: 200, description: 'The found transaction', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(@Param('id') id: string): Promise<TransactionResponseDto> {
    return new TransactionResponseDto(await this.transactionsService.findOne(+id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction by id' })
  @ApiParam({ name: 'id', description: 'Transaction id' })
  @ApiResponse({ status: 200, description: 'The updated transaction', type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'No data provided for update' })
  @ApiResponse({ status: 404, description: 'Transaction, Portfolio or Transaction Type not found' })
  async update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto): Promise<TransactionResponseDto> {
    return new TransactionResponseDto(await this.transactionsService.update(+id, updateTransactionDto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a transaction by id (soft delete)' })
  @ApiParam({ name: 'id', description: 'Transaction id' })
  @ApiResponse({ status: 200, description: 'Transaction has been marked as successfully removed' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.transactionsService.remove(+id);
  }
}
