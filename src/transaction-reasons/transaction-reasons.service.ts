import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTransactionReasonDto } from './dto/create-transaction-reason.dto';
import { UpdateTransactionReasonDto } from './dto/update-transaction-reason.dto';
import { TransactionReason } from './entities/transaction-reason.entity';
import { TransactionType } from '../transaction-types/entities/transaction-type.entity';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';

@Injectable()
export class TransactionReasonsService {
  constructor(
    @InjectRepository(TransactionReason)
    private readonly repository: Repository<TransactionReason>,
    @InjectRepository(TransactionType)
    private readonly transactionTypeRepository: Repository<TransactionType>,
  ) {}

  async create(
    createTransactionReasonDto: CreateTransactionReasonDto,
  ): Promise<TransactionReason> {
    // Verificar se o transaction type existe
    const transactionType = await this.transactionTypeRepository.findOne({
      where: { id: createTransactionReasonDto.transactionTypeId },
    });

    if (!transactionType) {
      throw new NotFoundException(
        `Transaction type with ID ${createTransactionReasonDto.transactionTypeId} not found`,
      );
    }

    // Verificar se já existe um reason com o mesmo nome
    const existingReason = await this.repository.findOne({
      where: { reason: createTransactionReasonDto.reason },
    });

    if (existingReason) {
      throw new BadRequestException(
        `Transaction reason '${createTransactionReasonDto.reason}' already exists`,
      );
    }

    const transactionReason = this.repository.create(
      createTransactionReasonDto,
    );
    return this.repository.save(transactionReason);
  }

  async findAll(): Promise<TransactionReason[]> {
    return this.repository.find({
      relations: ['transactionType'],
      order: { transactionTypeId: 'ASC', reason: 'ASC' },
    });
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
  ): Promise<PaginatedResponseDto<TransactionReason>> {
    const skip = (page - 1) * take;

    const [transactionReasons, total] = await this.repository.findAndCount({
      relations: ['transactionType'],
      take,
      skip,
      order: { transactionTypeId: 'ASC', reason: 'ASC' },
    });

    return new PaginatedResponseDto(transactionReasons, total, take, page);
  }

  async findByTransactionType(
    transactionTypeId: number,
  ): Promise<TransactionReason[]> {
    // Verificar se o transaction type existe
    const transactionType = await this.transactionTypeRepository.findOne({
      where: { id: transactionTypeId },
    });

    if (!transactionType) {
      throw new NotFoundException(
        `Transaction type with ID ${transactionTypeId} not found`,
      );
    }

    return this.repository.find({
      where: { transactionTypeId },
      relations: ['transactionType'],
      order: { reason: 'ASC' },
    });
  }

  async findOne(id: number): Promise<TransactionReason> {
    const transactionReason = await this.repository.findOne({
      where: { id },
      relations: ['transactionType'],
    });

    if (!transactionReason) {
      throw new NotFoundException(`Transaction reason with ID ${id} not found`);
    }

    return transactionReason;
  }

  /**
   * Busca uma razão de transação pelo nome/motivo
   * @param reason Nome da razão de transação (ex: "Compra", "Venda", "Depósito")
   * @returns TransactionReason encontrado ou lança exception
   */
  async findByReason(reason: string): Promise<TransactionReason> {
    const transactionReason = await this.repository.findOne({
      where: { reason },
      relations: ['transactionType'],
    });

    if (!transactionReason) {
      throw new NotFoundException(`Transaction reason '${reason}' not found`);
    }

    return transactionReason;
  }

  async update(
    id: number,
    updateTransactionReasonDto: UpdateTransactionReasonDto,
  ): Promise<TransactionReason> {
    if (
      !updateTransactionReasonDto ||
      Object.keys(updateTransactionReasonDto).length === 0
    ) {
      throw new BadRequestException('No properties provided for update');
    }

    const transactionReason = await this.findOne(id);

    // Se está atualizando o transaction type, verificar se existe
    if (updateTransactionReasonDto.transactionTypeId) {
      const transactionType = await this.transactionTypeRepository.findOne({
        where: { id: updateTransactionReasonDto.transactionTypeId },
      });

      if (!transactionType) {
        throw new NotFoundException(
          `Transaction type with ID ${updateTransactionReasonDto.transactionTypeId} not found`,
        );
      }
    }

    // Se está atualizando o reason, verificar duplicatas
    if (
      updateTransactionReasonDto.reason &&
      updateTransactionReasonDto.reason !== transactionReason.reason
    ) {
      const existingReason = await this.repository.findOne({
        where: { reason: updateTransactionReasonDto.reason },
      });

      if (existingReason) {
        throw new BadRequestException(
          `Transaction reason '${updateTransactionReasonDto.reason}' already exists`,
        );
      }
    }

    this.repository.merge(transactionReason, updateTransactionReasonDto);
    return this.repository.save(transactionReason);
  }

  async remove(id: number): Promise<void> {
    const transactionReason = await this.findOne(id);
    await this.repository.remove(transactionReason);
  }
}
