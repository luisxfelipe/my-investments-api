import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';
import { PaginatedTransactionResponseDto } from './dto/paginated-transaction-response.dto';

@ApiTags('transactions')
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

  @Get('pages')
  @ApiOperation({ summary: 'Find all transactions with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'take', required: false, description: 'Items per page', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of transactions',
    type: PaginatedTransactionResponseDto
  })
  async findAllWithPagination(
    @Query('take') take?: string,
    @Query('page') page?: string,
  ): Promise<PaginatedResponseDto<TransactionResponseDto>> {
    const takeNumber = take ? parseInt(take) : 10;
    const pageNumber = page ? parseInt(page) : 1;
    
    const transactions = await this.transactionsService.findAllWithPagination(
      takeNumber,
      pageNumber,
    );

    // Transformar as transações em DTOs de resposta
    const transactionDtos = transactions.data.map(
      transaction => new TransactionResponseDto(transaction)
    );

    // Retornar o objeto PaginatedResponseDto com os dados transformados
    return new PaginatedResponseDto<TransactionResponseDto>(
      transactionDtos,
      transactions.meta.totalItems,
      transactions.meta.itemsPerPage,
      transactions.meta.currentPage
    );
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
