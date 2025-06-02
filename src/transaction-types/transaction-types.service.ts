import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionType } from './entities/transaction-type.entity';
import { Repository } from 'typeorm';
import { TransactionsService } from 'src/transactions/transactions.service';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';

@Injectable()
export class TransactionTypesService {
  constructor(
    @InjectRepository(TransactionType)
    private readonly repository: Repository<TransactionType>,
    @Inject(forwardRef(() => TransactionsService))
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(
    createTransactionTypeDto: CreateTransactionTypeDto,
  ): Promise<TransactionType> {
    // Verifica se já existe um tipo de transação com o mesmo tipo
    const existingTransactionType = await this.findOneByType(
      createTransactionTypeDto.type,
    );

    if (existingTransactionType) {
      throw new BadRequestException(
        `There is already a transaction type with the type '${createTransactionTypeDto.type}'`,
      );
    }

    const transactionType = this.repository.create(createTransactionTypeDto);
    return this.repository.save(transactionType);
  }

  async findAll(): Promise<TransactionType[]> {
    return this.repository.find();
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
  ): Promise<PaginatedResponseDto<TransactionType>> {
    const skip = (page - 1) * take;

    const [transactionTypes, total] = await this.repository.findAndCount({
      take,
      skip,
    });

    return new PaginatedResponseDto(transactionTypes, total, take, page);
  }

  async findOne(id: number): Promise<TransactionType> {
    const transactionType = await this.repository.findOne({
      where: { id },
    });

    if (!transactionType) {
      throw new NotFoundException(`Transaction Type with ID ${id} not found`);
    }

    return transactionType;
  }

  async findOneByType(type: string): Promise<TransactionType | null> {
    return this.repository.findOne({ where: { type } });
  }

  async update(
    id: number,
    updateTransactionTypeDto: UpdateTransactionTypeDto,
  ): Promise<TransactionType> {
    if (
      !updateTransactionTypeDto ||
      Object.keys(updateTransactionTypeDto).length === 0
    ) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se o tipo de transação existe
    const transactionType = await this.findOne(id);

    // Se estiver atualizando o tipo, verifica se já existe outro tipo de transação com esse tipo
    if (
      updateTransactionTypeDto.type &&
      updateTransactionTypeDto.type !== transactionType.type
    ) {
      const existingTransactionType = await this.findOneByType(
        updateTransactionTypeDto.type,
      );

      if (existingTransactionType && existingTransactionType.id !== id) {
        throw new BadRequestException(
          `There is already a transaction type with the type '${updateTransactionTypeDto.type}'`,
        );
      }
    }

    this.repository.merge(transactionType, updateTransactionTypeDto);
    return this.repository.save(transactionType);
  }

  async remove(id: number): Promise<void> {
    // Verifica se o tipo de transação existe
    await this.findOne(id);

    // Verifica se o tipo de transação está sendo usado em alguma transação
    const transactionsCount = await this.countByTransactionTypeId(id);
    if (transactionsCount > 0) {
      throw new BadRequestException(
        `This transaction type cannot be deleted because it is being used by ${transactionsCount} transactions`,
      );
    }

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }

  /**
   * Conta quantas transações estão usando um tipo de transação específico
   */
  async countByTransactionTypeId(transactionTypeId: number): Promise<number> {
    const count =
      await this.transactionsService.countByTransactionTypeId(
        transactionTypeId,
      );
    return count;
  }
}
