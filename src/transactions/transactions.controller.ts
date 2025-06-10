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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransferResponseDto } from './dto/transfer-response.dto';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';
import { PaginatedTransactionResponseDto } from './dto/paginated-transaction-response.dto';
import { UserDecorator } from 'src/decorators/user.decorator';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new transaction',
    description: `
      Creates a new transaction (buy, sell, deposit, withdrawal, etc.).

      **Important:** Transfers cannot be created using this endpoint.
      Use POST /transactions/transfer for automatic linked transfers between portfolios.

      **Supported transaction types:**
      - Buy operations
      - Sell operations
      - Deposits
      - Withdrawals
      - Other non-transfer transactions
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'The transaction has been successfully created',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid data or attempt to create transfer transaction manually',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio or Transaction Type not found',
  })
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @UserDecorator() userId: number,
  ): Promise<TransactionResponseDto> {
    return new TransactionResponseDto(
      await this.transactionsService.create(createTransactionDto, userId),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find all transactions' })
  @ApiResponse({
    status: 200,
    description: 'List of all transactions',
    type: [TransactionResponseDto],
  })
  async findAll(
    @UserDecorator() userId: number,
  ): Promise<TransactionResponseDto[]> {
    const transactions = await this.transactionsService.findAll(userId);
    return transactions.map(
      (transaction) => new TransactionResponseDto(transaction),
    );
  }

  @Get('pages')
  @ApiOperation({ summary: 'Find all transactions with pagination' })
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
    description: 'Paginated list of transactions',
    type: PaginatedTransactionResponseDto,
  })
  async findAllWithPagination(
    @UserDecorator() userId: number,
    @Query('take') take?: string,
    @Query('page') page?: string,
  ): Promise<PaginatedResponseDto<TransactionResponseDto>> {
    const takeNumber = take && !isNaN(parseInt(take)) ? parseInt(take) : 10;
    const pageNumber = page && !isNaN(parseInt(page)) ? parseInt(page) : 1;

    const transactions = await this.transactionsService.findAllWithPagination(
      takeNumber,
      pageNumber,
      userId,
    );

    // Transformar as transações em DTOs de resposta
    const transactionDtos = transactions.data.map(
      (transaction) => new TransactionResponseDto(transaction),
    );

    // Retornar o objeto PaginatedResponseDto com os dados transformados
    return new PaginatedResponseDto<TransactionResponseDto>(
      transactionDtos,
      transactions.meta.totalItems,
      transactions.meta.itemsPerPage,
      transactions.meta.currentPage,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one transaction by id' })
  @ApiParam({ name: 'id', description: 'Transaction id' })
  @ApiResponse({
    status: 200,
    description: 'The found transaction',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<TransactionResponseDto> {
    return new TransactionResponseDto(
      await this.transactionsService.findOne(+id, userId),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction by id' })
  @ApiParam({ name: 'id', description: 'Transaction id' })
  @ApiResponse({
    status: 200,
    description: 'The updated transaction',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No data provided for update' })
  @ApiResponse({
    status: 404,
    description: 'Transaction, Portfolio or Transaction Type not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @UserDecorator() userId: number,
  ): Promise<TransactionResponseDto> {
    return new TransactionResponseDto(
      await this.transactionsService.update(+id, updateTransactionDto, userId),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a transaction by id (soft delete)',
    description: `
      Removes a single transaction by ID.

      **Important Restrictions:**
      - Transfer transactions cannot be deleted individually
      - Only the most recent transaction in each portfolio can be deleted
      - Maintains chronological order integrity

      **For Transfer Transactions:**
      Use DELETE /transactions/transfer/:id to safely remove complete transfers.

      **Safety Features:**
      - Automatic portfolio balance recalculation
      - Chronological order validation
    `,
  })
  @ApiParam({ name: 'id', description: 'Transaction id' })
  @ApiResponse({
    status: 204,
    description: 'Transaction has been marked as successfully removed',
  })
  @ApiResponse({
    status: 400,
    description:
      'Transfer transaction (use DELETE /transactions/transfer/:id) or chronological order violation',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async remove(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<void> {
    await this.transactionsService.remove(+id, userId);
  }

  /**
   * Busca todas as transações de uma plataforma específica
   */
  @Get('platform/:platformId')
  @ApiOperation({ summary: 'Find all transactions from a specific platform' })
  @ApiParam({ name: 'platformId', description: 'Platform id' })
  @ApiResponse({
    status: 200,
    description: 'List of transactions from the platform',
    type: [TransactionResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async findByPlatform(
    @Param('platformId') platformId: string,
    @UserDecorator() userId: number,
  ): Promise<TransactionResponseDto[]> {
    const transactions = await this.transactionsService.findAllByPlatformId(
      +platformId,
      userId,
    );
    return transactions.map(
      (transaction) => new TransactionResponseDto(transaction),
    );
  }

  /**
   * Busca todas as transações de uma plataforma com paginação
   */
  @Get('platform/:platformId/pages')
  @ApiOperation({
    summary: 'Find all transactions from a specific platform with pagination',
  })
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
    description: 'Paginated list of transactions from the platform',
    type: PaginatedTransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Platform not found' })
  async findByPlatformWithPagination(
    @Param('platformId') platformId: string,
    @UserDecorator() userId: number,
    @Query('take') take?: number,
    @Query('page') page?: number,
  ): Promise<PaginatedResponseDto<TransactionResponseDto>> {
    const paginatedTransactions =
      await this.transactionsService.findAllByPlatformIdWithPagination(
        +platformId,
        userId,
        take,
        page,
      );

    return new PaginatedResponseDto<TransactionResponseDto>(
      paginatedTransactions.data.map(
        (transaction) => new TransactionResponseDto(transaction),
      ),
      paginatedTransactions.meta.totalItems,
      paginatedTransactions.meta.itemsPerPage,
      paginatedTransactions.meta.currentPage,
    );
  }

  /**
   * Busca todas as transações de um portfolio específico com paginação
   */
  @Get('portfolio/:portfolioId/pages')
  @ApiOperation({
    summary: 'Find all transactions from a specific portfolio with pagination',
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio id' })
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
    description: 'Paginated list of transactions from the portfolio',
    type: PaginatedTransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async findByPortfolioWithPagination(
    @Param('portfolioId') portfolioId: string,
    @UserDecorator() userId: number,
    @Query('take') take?: number,
    @Query('page') page?: number,
  ): Promise<PaginatedResponseDto<TransactionResponseDto>> {
    const paginatedTransactions =
      await this.transactionsService.findAllByPortfolioIdWithPagination(
        +portfolioId,
        userId,
        take,
        page,
      );

    return new PaginatedResponseDto<TransactionResponseDto>(
      paginatedTransactions.data.map(
        (transaction) => new TransactionResponseDto(transaction),
      ),
      paginatedTransactions.meta.totalItems,
      paginatedTransactions.meta.itemsPerPage,
      paginatedTransactions.meta.currentPage,
    );
  }

  @Post('transfer')
  @ApiOperation({
    summary: 'Transfer assets between portfolios',
    description: `
      Transfers assets between two portfolios of the same asset type.

      **Automatic Pricing:**
      - For currencies (USD, BRL, EUR): unitPrice = 1 (automatic)
      - For other assets (BTC, ETH, AAPL): unitPrice = current average price (automatic)

      **Requirements:**
      - Both portfolios must contain the same asset
      - Source portfolio must have sufficient balance
      - User must own both portfolios

      **Note:** Unit price is calculated automatically based on asset type and current portfolio state.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'The transfer was completed successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data, insufficient balance, or asset type mismatch',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found or does not belong to the user',
  })
  async transfer(
    @Body() createTransferDto: CreateTransferDto,
    @UserDecorator() userId: number,
  ): Promise<TransferResponseDto> {
    const result = await this.transactionsService.createUnifiedTransfer(
      createTransferDto,
      userId,
    );

    return {
      sourceTransaction: new TransactionResponseDto(result.sourceTransaction),
      targetTransaction: new TransactionResponseDto(result.targetTransaction),
    };
  }

  @Delete('transfer/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a complete transfer by transaction id (safe deletion)',
    description: `
      Safely removes a complete transfer by deleting both linked transactions atomically.

      **How it works:**
      - Accepts the ID of any transaction that is part of a transfer pair
      - Automatically finds and deletes both the source and target transactions
      - Uses database transaction to ensure atomically deletion
      - Recalculates portfolio balances after deletion

      **Safety features:**
      - Only allows deletion of the most recent transaction in each portfolio
      - Maintains chronological order integrity
      - Automatically handles portfolio balance recalculation

      **Note:** This is the only safe way to delete transfer transactions.
      Individual transaction deletion via DELETE /transactions/:id is blocked for transfers.
    `,
  })
  @ApiParam({
    name: 'id',
    description:
      'ID of any transaction from the transfer pair (source or target)',
  })
  @ApiResponse({
    status: 204,
    description:
      'Transfer has been completely removed (both transactions deleted)',
  })
  @ApiResponse({
    status: 400,
    description:
      'Transaction is not a transfer or chronological order would be violated',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found or does not belong to user',
  })
  async removeTransfer(
    @Param('id') id: string,
    @UserDecorator() userId: number,
  ): Promise<void> {
    await this.transactionsService.removeTransfer(+id, userId);
  }
}
