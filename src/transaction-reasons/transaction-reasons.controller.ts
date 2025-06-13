import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionReasonsService } from './transaction-reasons.service';
import { CreateTransactionReasonDto } from './dto/create-transaction-reason.dto';
import { UpdateTransactionReasonDto } from './dto/update-transaction-reason.dto';
import { TransactionReasonResponseDto } from './dto/transaction-reason-response.dto';
import { PaginatedTransactionReasonResponseDto } from './dto/paginated-transaction-reason-response.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Transaction Reasons')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('transaction-reasons')
export class TransactionReasonsController {
  constructor(
    private readonly transactionReasonsService: TransactionReasonsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction reason' })
  @ApiResponse({
    status: 201,
    description: 'Transaction reason created successfully',
    type: TransactionReasonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(
    @Body() createTransactionReasonDto: CreateTransactionReasonDto,
  ): Promise<TransactionReasonResponseDto> {
    const transactionReason = await this.transactionReasonsService.create(
      createTransactionReasonDto,
    );
    return new TransactionReasonResponseDto(transactionReason);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transaction reasons' })
  @ApiResponse({
    status: 200,
    description: 'List of all transaction reasons',
    type: [TransactionReasonResponseDto],
  })
  async findAll(): Promise<TransactionReasonResponseDto[]> {
    const transactionReasons = await this.transactionReasonsService.findAll();
    return transactionReasons.map(
      (reason) => new TransactionReasonResponseDto(reason),
    );
  }

  @Get('pages')
  @ApiOperation({ summary: 'Get all transaction reasons with pagination' })
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
    description: 'Paginated list of transaction reasons',
    type: PaginatedTransactionReasonResponseDto,
  })
  async findAllWithPagination(
    @Query('take') take: string = '10',
    @Query('page') page: string = '1',
  ): Promise<PaginatedResponseDto<TransactionReasonResponseDto>> {
    const takeNumber = parseInt(take);
    const pageNumber = parseInt(page);

    const transactionReasons =
      await this.transactionReasonsService.findAllWithPagination(
        takeNumber,
        pageNumber,
      );

    // Transformar as transaction reasons em DTOs de resposta
    const transactionReasonDtos = transactionReasons.data.map(
      (reason) => new TransactionReasonResponseDto(reason),
    );

    // Retornar o objeto PaginatedResponseDto com os dados transformados
    return new PaginatedResponseDto<TransactionReasonResponseDto>(
      transactionReasonDtos,
      transactionReasons.meta.totalItems,
      transactionReasons.meta.itemsPerPage,
      transactionReasons.meta.currentPage,
    );
  }

  @Get('by-type/:transactionTypeId')
  @ApiOperation({ summary: 'Get transaction reasons by transaction type' })
  @ApiResponse({
    status: 200,
    description: 'List of transaction reasons for the specified type',
    type: [TransactionReasonResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Transaction type not found' })
  async findByTransactionType(
    @Param('transactionTypeId') transactionTypeId: string,
  ): Promise<TransactionReasonResponseDto[]> {
    const transactionReasons =
      await this.transactionReasonsService.findByTransactionType(
        +transactionTypeId,
      );
    return transactionReasons.map(
      (reason) => new TransactionReasonResponseDto(reason),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction reason by ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction reason found',
    type: TransactionReasonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction reason not found' })
  async findOne(
    @Param('id') id: string,
  ): Promise<TransactionReasonResponseDto> {
    const transactionReason = await this.transactionReasonsService.findOne(+id);
    return new TransactionReasonResponseDto(transactionReason);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction reason' })
  @ApiResponse({
    status: 200,
    description: 'Transaction reason updated successfully',
    type: TransactionReasonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction reason not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async update(
    @Param('id') id: string,
    @Body() updateTransactionReasonDto: UpdateTransactionReasonDto,
  ): Promise<TransactionReasonResponseDto> {
    const transactionReason = await this.transactionReasonsService.update(
      +id,
      updateTransactionReasonDto,
    );
    return new TransactionReasonResponseDto(transactionReason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction reason' })
  @ApiResponse({
    status: 200,
    description: 'Transaction reason deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction reason not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.transactionReasonsService.remove(+id);
  }
}
