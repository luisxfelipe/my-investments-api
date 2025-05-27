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
    userId: number,
  ): Promise<TransactionType> {
    // Verifica se já existe um tipo de transação com o mesmo nome para o mesmo usuário
    const existingTransactionType = await this.findOneByNameAndUserId(
      createTransactionTypeDto.name,
      userId,
    );

    if (existingTransactionType) {
      throw new BadRequestException(
        `There is already a transaction type with the name '${createTransactionTypeDto.name}'`,
      );
    }

    const transactionType = this.repository.create({
      ...createTransactionTypeDto,
      userId,
    });
    return this.repository.save(transactionType);
  }

  async findAll(userId: number): Promise<TransactionType[]> {
    return this.repository.find({
      where: { userId },
    });
  }

  async findOne(id: number, userId?: number): Promise<TransactionType> {
    const whereCondition: { id: number; userId?: number } = { id };
    if (userId !== undefined) {
      whereCondition.userId = userId;
    }

    const transactionType = await this.repository.findOne({
      where: whereCondition,
    });

    if (!transactionType) {
      throw new NotFoundException(`Transaction Type with ID ${id} not found`);
    }

    return transactionType;
  }

  async findOneByNameAndUserId(
    name: string,
    userId: number,
  ): Promise<TransactionType | null> {
    return this.repository.findOne({ where: { name, userId } });
  }

  async update(
    id: number,
    updateTransactionTypeDto: UpdateTransactionTypeDto,
    userId: number,
  ): Promise<TransactionType> {
    if (
      !updateTransactionTypeDto ||
      Object.keys(updateTransactionTypeDto).length === 0
    ) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se o tipo de transação existe e pertence ao usuário
    const transactionType = await this.findOne(id, userId);

    // Se estiver atualizando o nome, verifica se já existe outro tipo de transação com esse nome para o mesmo usuário
    if (
      updateTransactionTypeDto.name &&
      updateTransactionTypeDto.name !== transactionType.name
    ) {
      const existingTransactionType = await this.findOneByNameAndUserId(
        updateTransactionTypeDto.name,
        userId,
      );

      if (existingTransactionType && existingTransactionType.id !== id) {
        throw new BadRequestException(
          `There is already a transaction type with the name '${updateTransactionTypeDto.name}'`,
        );
      }
    }

    this.repository.merge(transactionType, updateTransactionTypeDto);
    return this.repository.save(transactionType);
  }

  async remove(id: number, userId: number): Promise<void> {
    // Verifica se o tipo de transação existe e pertence ao usuário
    await this.findOne(id, userId);

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
