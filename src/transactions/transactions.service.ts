import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
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
    @Inject(forwardRef(() => PortfoliosService))
    private readonly portfoliosService: PortfoliosService,
    private readonly transactionTypesService: TransactionTypesService,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    userId: number,
  ): Promise<Transaction> {
    // Verifica se o portfólio existe e pertence ao usuário
    const portfolio = await this.portfoliosService.findOne(
      createTransactionDto.portfolioId,
      userId,
    );

    // Verifica se o tipo de transação existe e pertence ao usuário
    await this.transactionTypesService.findOne(
      createTransactionDto.transactionTypeId,
      userId,
    );

    // ✅ NOVA VALIDAÇÃO: Verificar saldo para vendas (ID 2 = VENDA)
    if (createTransactionDto.transactionTypeId === 2) {
      if (portfolio.currentBalance < createTransactionDto.quantity) {
        throw new BadRequestException(
          `Insufficient balance for sale. ` +
            `Available: ${portfolio.currentBalance}, ` +
            `Attempted: ${createTransactionDto.quantity}`,
        );
      }
    }

    const transaction = this.repository.create(createTransactionDto);
    const savedTransaction = await this.repository.save(transaction);

    // ✅ Recalcular saldo do portfolio após a transação
    await this.portfoliosService.recalculatePortfolioBalance(portfolio.id);

    return savedTransaction;
  }

  async findAll(userId: number): Promise<Transaction[]> {
    return this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.portfolio', 'portfolio')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .where('portfolio.userId = :userId', { userId })
      .getMany();
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
      .leftJoinAndSelect('asset.category', 'category')
      .leftJoinAndSelect('asset.assetType', 'assetType')
      .leftJoinAndSelect('portfolio.platform', 'platform')
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
    userId: number,
  ): Promise<PaginatedResponseDto<Transaction>> {
    const skip = (page - 1) * take;

    const [transactions, total] = await this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.portfolio', 'portfolio')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('portfolio.asset', 'asset')
      .leftJoinAndSelect('asset.category', 'category')
      .leftJoinAndSelect('asset.assetType', 'assetType')
      .leftJoinAndSelect('portfolio.platform', 'platform')
      .where('portfolio.userId = :userId', { userId })
      .take(take)
      .skip(skip)
      .getManyAndCount();

    return new PaginatedResponseDto(transactions, total, take, page);
  }

  async findOne(id: number, userId: number): Promise<Transaction> {
    const transaction = await this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.portfolio', 'portfolio')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('portfolio.asset', 'asset')
      .leftJoinAndSelect('asset.category', 'category')
      .leftJoinAndSelect('asset.assetType', 'assetType')
      .leftJoinAndSelect('portfolio.platform', 'platform')
      .where('transaction.id = :id', { id })
      .andWhere('portfolio.userId = :userId', { userId })
      .getOne();

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${id} not found or you don't have access to it`,
      );
    }

    return transaction;
  }

  async update(
    id: number,
    updateTransactionDto: UpdateTransactionDto,
    userId: number,
  ): Promise<Transaction> {
    if (
      !updateTransactionDto ||
      Object.keys(updateTransactionDto).length === 0
    ) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se a transação existe e pertence ao usuário
    const transaction = await this.findOne(id, userId);

    // Verifica se o portfólio existe e pertence ao usuário, se foi fornecido
    if (updateTransactionDto.portfolioId) {
      await this.portfoliosService.findOne(
        updateTransactionDto.portfolioId,
        userId,
      );
    }

    // Verifica se o tipo de transação existe e pertence ao usuário, se foi fornecido
    if (updateTransactionDto.transactionTypeId) {
      await this.transactionTypesService.findOne(
        updateTransactionDto.transactionTypeId,
        userId,
      );
    }

    // ✅ NOVA VALIDAÇÃO: Verificar saldo para vendas (ID 2 = VENDA)
    const isChangingToSale = updateTransactionDto.transactionTypeId === 2;
    const isAlreadySale = transaction.transactionTypeId === 2;
    const isChangingQuantity = updateTransactionDto.quantity !== undefined;

    if (isChangingToSale || (isAlreadySale && isChangingQuantity)) {
      const portfolioId =
        updateTransactionDto.portfolioId || transaction.portfolioId;
      const portfolio = await this.portfoliosService.findOne(
        portfolioId,
        userId,
      );

      // Quantidade atual da transação (para remover do cálculo)
      const currentTransactionQuantity = isAlreadySale
        ? transaction.quantity
        : 0;

      // Nova quantidade da transação
      const newTransactionQuantity =
        updateTransactionDto.quantity || transaction.quantity;

      // Saldo disponível = saldo atual + quantidade atual da transação
      const availableBalance =
        portfolio.currentBalance + currentTransactionQuantity;

      if (availableBalance < newTransactionQuantity) {
        throw new BadRequestException(
          `Insufficient balance for sale. ` +
            `Available: ${availableBalance}, ` +
            `Attempted: ${newTransactionQuantity}`,
        );
      }
    }

    this.repository.merge(transaction, updateTransactionDto);
    const updatedTransaction = await this.repository.save(transaction);

    // ✅ Recalcular saldo do portfolio após a atualização
    await this.portfoliosService.recalculatePortfolioBalance(
      transaction.portfolioId,
    );

    return updatedTransaction;
  }

  async findAllByPortfolioId(
    portfolioId: number,
    userId?: number,
  ): Promise<Transaction[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.portfolio', 'portfolio')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('portfolio.asset', 'asset')
      .leftJoinAndSelect('portfolio.asset.category', 'category')
      .leftJoinAndSelect('portfolio.asset.assetType', 'assetType')
      .leftJoinAndSelect('portfolio.platform', 'platform')
      .where('transaction.portfolioId = :portfolioId', { portfolioId });

    if (userId) {
      queryBuilder.andWhere('portfolio.userId = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async remove(id: number, userId: number): Promise<void> {
    // Verifica se a transação existe e pertence ao usuário
    await this.findOne(id, userId);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }

  /**
   * Conta quantas transações estão usando um tipo de transação específico
   */
  async countByTransactionTypeId(transactionTypeId: number): Promise<number> {
    return this.repository.count({
      where: { transactionTypeId },
    });
  }
}
