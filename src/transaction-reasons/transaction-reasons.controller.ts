import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionReasonsService } from './transaction-reasons.service';
import { CreateTransactionReasonDto } from './dto/create-transaction-reason.dto';
import { UpdateTransactionReasonDto } from './dto/update-transaction-reason.dto';
import { TransactionReason } from './entities/transaction-reason.entity';
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
    type: TransactionReason,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(
    @Body() createTransactionReasonDto: CreateTransactionReasonDto,
  ): Promise<TransactionReason> {
    return this.transactionReasonsService.create(createTransactionReasonDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transaction reasons' })
  @ApiResponse({
    status: 200,
    description: 'List of all transaction reasons',
    type: [TransactionReason],
  })
  findAll(): Promise<TransactionReason[]> {
    return this.transactionReasonsService.findAll();
  }

  @Get('by-type/:transactionTypeId')
  @ApiOperation({ summary: 'Get transaction reasons by transaction type' })
  @ApiResponse({
    status: 200,
    description: 'List of transaction reasons for the specified type',
    type: [TransactionReason],
  })
  @ApiResponse({ status: 404, description: 'Transaction type not found' })
  findByTransactionType(
    @Param('transactionTypeId') transactionTypeId: string,
  ): Promise<TransactionReason[]> {
    return this.transactionReasonsService.findByTransactionType(
      +transactionTypeId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction reason by ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction reason found',
    type: TransactionReason,
  })
  @ApiResponse({ status: 404, description: 'Transaction reason not found' })
  findOne(@Param('id') id: string): Promise<TransactionReason> {
    return this.transactionReasonsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction reason' })
  @ApiResponse({
    status: 200,
    description: 'Transaction reason updated successfully',
    type: TransactionReason,
  })
  @ApiResponse({ status: 404, description: 'Transaction reason not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  update(
    @Param('id') id: string,
    @Body() updateTransactionReasonDto: UpdateTransactionReasonDto,
  ): Promise<TransactionReason> {
    return this.transactionReasonsService.update(
      +id,
      updateTransactionReasonDto,
    );
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
