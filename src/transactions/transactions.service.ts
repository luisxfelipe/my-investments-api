import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Repository } from 'typeorm';
import { TransactionTypesService } from 'src/transaction-types/transaction-types.service';
import { PortfoliosService } from 'src/portfolios/portfolios.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
    private readonly portfoliosService: PortfoliosService,
    private readonly transactionTypesService: TransactionTypesService,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    // Verifica se o portfólio existe
    await this.portfoliosService.findOne(createTransactionDto.portfolioId);

    // Verifica se o tipo de transação existe
    await this.transactionTypesService.findOne(
      createTransactionDto.transactionTypeId,
    );

    const transaction = this.repository.create(createTransactionDto);
    return this.repository.save(transaction);
  }

  async findAll(): Promise<Transaction[]> {
    return this.repository.find({
      relations: ['portfolio', 'transactionType'],
    });
  }

  async findAllByPlatformId(
    platformId: number,
    userId: number,
  ): Promise<Transaction[]> {
    return this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.portfolio', 'portfolio')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('portfolio.asset', 'asset')
      .where('portfolio.platformId = :platformId', { platformId })
      .andWhere('portfolio.userId = :userId', { userId })
      .getMany();
  }

  async findAllByPlatformIdWithPagination(
    platformId: number,
    userId: number,
    take = 10,
    page = 1,
  ): Promise<PaginatedResponseDto<Transaction>> {
    const skip = (page - 1) * take;
    const [transactions, total] = await this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.portfolio', 'portfolio')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('transaction.asset', 'asset')
      .where('asset.platformId = :platformId', { platformId })
      .andWhere('portfolio.userId = :userId', { userId })
      .take(take)
      .skip(skip)
      .getManyAndCount();
    return new PaginatedResponseDto(transactions, total, take, page);
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
  ): Promise<PaginatedResponseDto<Transaction>> {
    const skip = (page - 1) * take;

    const [transactions, total] = await this.repository.findAndCount({
      relations: ['portfolio', 'transactionType'],
      take,
      skip,
    });

    return new PaginatedResponseDto(transactions, total, take, page);
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.repository.findOne({
      where: { id },
      relations: ['portfolio', 'transactionType'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async update(
    id: number,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    if (
      !updateTransactionDto ||
      Object.keys(updateTransactionDto).length === 0
    ) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se a transação existe
    const transaction = await this.findOne(id);

    // Verifica se o portfólio existe, se foi fornecido
    if (updateTransactionDto.portfolioId) {
      await this.portfoliosService.findOne(updateTransactionDto.portfolioId);
    }

    // Verifica se o tipo de transação existe, se foi fornecido
    if (updateTransactionDto.transactionTypeId) {
      await this.transactionTypesService.findOne(
        updateTransactionDto.transactionTypeId,
      );
    }

    this.repository.merge(transaction, updateTransactionDto);
    return this.repository.save(transaction);
  }

  async findAllByPortfolioId(portfolioId: number): Promise<Transaction[]> {
    return this.repository.find({
      where: { portfolioId },
      relations: ['transactionType'],
    });
  }

  async remove(id: number): Promise<void> {
    // Verifica se a transação existe
    await this.findOne(id);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }
}
