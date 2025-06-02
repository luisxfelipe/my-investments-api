import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { Repository } from 'typeorm';
import { TransactionReasonsService } from 'src/transaction-reasons/transaction-reasons.service';
import { TransactionTypesService } from 'src/transaction-types/transaction-types.service';
import { PortfoliosService } from 'src/portfolios/portfolios.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';
import {
  TransactionTypeHelper,
  TRANSACTION_REASON_NAMES,
  TRANSACTION_TYPE_IDS,
} from 'src/constants/transaction-types.constants';
import { CurrencyHelper } from 'src/constants/currency.helper';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
    @Inject(forwardRef(() => PortfoliosService))
    private readonly portfoliosService: PortfoliosService,
    private readonly transactionReasonsService: TransactionReasonsService,
    @Inject(forwardRef(() => TransactionTypesService))
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

    // Verifica se a razão de transação existe
    const transactionReason = await this.transactionReasonsService.findOne(
      createTransactionDto.transactionReasonId,
    );

    // ✅ VALIDAÇÃO DE DATA: Verificar se a data não é anterior à última transação
    await this.validateTransactionDate(
      createTransactionDto.portfolioId,
      createTransactionDto.transactionDate,
    );

    // ✅ VALIDAÇÃO SEGURA: Verificar saldo para vendas (SAÍDA)
    if (TransactionTypeHelper.isSaida(transactionReason.transactionTypeId)) {
      await this.portfoliosService.validateSaleTransaction(
        createTransactionDto.portfolioId,
        createTransactionDto.quantity,
        userId,
      );
    }

    const transaction = this.repository.create({
      ...createTransactionDto,
      totalValue:
        createTransactionDto.quantity * createTransactionDto.unitPrice -
        (createTransactionDto.fee || 0),
    });
    const savedTransaction = await this.repository.save(transaction);

    // ✅ Recalcular saldo e preço médio do portfolio após a transação
    await this.portfoliosService.recalculatePortfolioBalance(portfolio.id);
    // Não precisamos chamar recalculateAveragePrice separadamente pois o recalculatePortfolioBalance já atualiza ambos

    return savedTransaction;
  }

  async findAll(userId: number): Promise<Transaction[]> {
    return this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.portfolio', 'portfolio')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('transaction.transactionReason', 'transactionReason')
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
      .leftJoinAndSelect('transaction.transactionReason', 'transactionReason')
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
      .leftJoinAndSelect('transaction.transactionReason', 'transactionReason')
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
    if (isNaN(take) || isNaN(page) || isNaN(userId)) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (page - 1) * take;

    const [transactions, total] = await this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.portfolio', 'portfolio')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('transaction.transactionReason', 'transactionReason')
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
      .leftJoinAndSelect('transaction.transactionReason', 'transactionReason')
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

    // ✅ VALIDAÇÃO DE ORDEM CRONOLÓGICA: Verificar se é a última transação do portfólio
    await this.validateIsLastTransaction(id, transaction.portfolioId);

    // ✅ VALIDAÇÃO SEGURA: Verificar se o portfolio da transação ainda existe e pertence ao usuário
    await this.portfoliosService.findOne(transaction.portfolioId, userId);

    // Verifica se o tipo de transação existe, se foi fornecido
    if (updateTransactionDto.transactionTypeId) {
      await this.transactionTypesService.findOne(
        updateTransactionDto.transactionTypeId,
      );
    }

    // Verifica se a razão de transação existe, se foi fornecida
    if (updateTransactionDto.transactionReasonId) {
      await this.transactionReasonsService.findOne(
        updateTransactionDto.transactionReasonId,
      );
    }

    // ✅ VALIDAÇÃO DE DATA: Verificar se a nova data não é anterior à última transação
    if (updateTransactionDto.transactionDate) {
      await this.validateTransactionDate(
        transaction.portfolioId,
        updateTransactionDto.transactionDate,
        id, // Excluir a transação atual da validação
      );
    }

    // ✅ VALIDAÇÃO SEGURA: Verificar saldo para vendas
    const isChangingToSale =
      updateTransactionDto.transactionTypeId &&
      TransactionTypeHelper.isSaida(updateTransactionDto.transactionTypeId);
    const isAlreadySale = TransactionTypeHelper.isSaida(
      transaction.transactionTypeId,
    );
    const isChangingQuantity = updateTransactionDto.quantity !== undefined;

    if (isChangingToSale || (isAlreadySale && isChangingQuantity)) {
      const portfolioId = transaction.portfolioId;

      // Nova quantidade da transação
      const newTransactionQuantity =
        updateTransactionDto.quantity || transaction.quantity;

      // Para validação de vendas, sempre usar recálculo seguro
      // Primeiro, temporariamente "devolver" a quantidade atual se for venda existente
      if (isAlreadySale) {
        // Recalcular considerando que vamos remover a transação atual
        const transactions = await this.findAllByPortfolioId(portfolioId);
        const transactionsWithoutCurrent = transactions.filter(
          (t) => t.id !== transaction.id,
        );
        const balanceWithoutCurrent =
          this.portfoliosService.calculateTotalQuantity(
            transactionsWithoutCurrent,
          );

        if (balanceWithoutCurrent < newTransactionQuantity) {
          throw new BadRequestException(
            `Insufficient balance for sale. ` +
              `Available: ${balanceWithoutCurrent}, ` +
              `Attempted: ${newTransactionQuantity}`,
          );
        }
      } else {
        // Para mudança para venda ou nova venda, usar validação segura
        await this.portfoliosService.validateSaleTransaction(
          portfolioId,
          newTransactionQuantity,
          userId,
        );
      }
    }

    // Calculate totalValue based on the final values
    const finalQuantity =
      updateTransactionDto.quantity !== undefined
        ? updateTransactionDto.quantity
        : transaction.quantity;
    const finalUnitPrice =
      updateTransactionDto.unitPrice !== undefined
        ? updateTransactionDto.unitPrice
        : transaction.unitPrice;
    const finalFee =
      updateTransactionDto.fee !== undefined
        ? updateTransactionDto.fee
        : transaction.fee;

    const calculatedTotalValue =
      finalQuantity * finalUnitPrice - (finalFee || 0);

    this.repository.merge(transaction, {
      ...updateTransactionDto,
      totalValue: calculatedTotalValue,
    });
    const updatedTransaction = await this.repository.save(transaction);

    // ✅ Recalcular saldo e preço médio do portfolio após a atualização
    await this.portfoliosService.recalculatePortfolioBalance(
      transaction.portfolioId,
    );
    // Não precisamos chamar recalculateAveragePrice separadamente pois o recalculatePortfolioBalance já atualiza ambos

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
      .leftJoinAndSelect('transaction.transactionReason', 'transactionReason')
      .leftJoinAndSelect('portfolio.asset', 'asset')
      .leftJoinAndSelect('asset.category', 'category')
      .leftJoinAndSelect('asset.assetType', 'assetType')
      .leftJoinAndSelect('portfolio.platform', 'platform')
      .where('transaction.portfolioId = :portfolioId', { portfolioId });

    if (userId) {
      queryBuilder.andWhere('portfolio.userId = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async findAllByPortfolioIdWithPagination(
    portfolioId: number,
    userId: number,
    take = 10,
    page = 1,
  ): Promise<PaginatedResponseDto<Transaction>> {
    const skip = (page - 1) * take;

    const [transactions, total] = await this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.portfolio', 'portfolio')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('transaction.transactionReason', 'transactionReason')
      .leftJoinAndSelect('portfolio.asset', 'asset')
      .leftJoinAndSelect('asset.category', 'category')
      .leftJoinAndSelect('asset.assetType', 'assetType')
      .leftJoinAndSelect('portfolio.platform', 'platform')
      .where('transaction.portfolioId = :portfolioId', { portfolioId })
      .andWhere('portfolio.userId = :userId', { userId })
      .take(take)
      .skip(skip)
      .orderBy('transaction.createdAt', 'DESC')
      .getManyAndCount();

    return new PaginatedResponseDto(transactions, total, take, page);
  }

  async remove(id: number, userId: number): Promise<void> {
    // Verifica se a transação existe e pertence ao usuário
    const transaction = await this.findOne(id, userId);
    const portfolioId = transaction.portfolioId;

    // ✅ VALIDAÇÃO DE ORDEM CRONOLÓGICA: Verificar se é a última transação do portfólio
    await this.validateIsLastTransaction(id, transaction.portfolioId);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);

    // ✅ Recalcular saldo e preço médio do portfolio após a exclusão
    await this.portfoliosService.recalculatePortfolioBalance(portfolioId);
    // Não precisamos chamar recalculateAveragePrice separadamente pois o recalculatePortfolioBalance já atualiza ambos
  }

  /**
   * Conta quantas transações estão usando um tipo de transação específico
   */
  async countByTransactionTypeId(transactionTypeId: number): Promise<number> {
    return this.repository.count({
      where: { transactionTypeId },
    });
  }

  /**
   * Valida se a data da transação não é anterior à última transação do portfólio
   */
  async validateTransactionDate(
    portfolioId: number,
    transactionDate: Date,
    excludeTransactionId?: number,
  ): Promise<void> {
    const queryBuilder = this.repository
      .createQueryBuilder('transaction')
      .where('transaction.portfolioId = :portfolioId', { portfolioId })
      .orderBy('transaction.transactionDate', 'DESC')
      .limit(1);

    // Excluir transação atual em caso de update
    if (excludeTransactionId) {
      queryBuilder.andWhere('transaction.id != :excludeTransactionId', {
        excludeTransactionId,
      });
    }

    const lastTransaction = await queryBuilder.getOne();

    if (lastTransaction && transactionDate < lastTransaction.transactionDate) {
      const lastDateFormatted = lastTransaction.transactionDate
        .toISOString()
        .split('T')[0];
      const newDateFormatted = transactionDate.toISOString().split('T')[0];

      throw new BadRequestException(
        `Transaction date (${newDateFormatted}) cannot be earlier than the last transaction date (${lastDateFormatted})`,
      );
    }
  }

  /**
   * Registra um depósito de moeda em um portfolio
   * @param portfolioId ID do portfolio de moeda
   * @param amount Valor do depósito
   * @param date Data da transação
   * @param userId ID do usuário
   * @param notes Observações (opcional)
   * @returns Transaction criada
   */
  async createDeposit(
    portfolioId: number,
    amount: number,
    date: Date,
    userId: number,
    notes?: string,
  ): Promise<Transaction> {
    // Encontra o motivo de transação para depósito
    const depositReason = await this.transactionReasonsService.findByReason(
      TRANSACTION_REASON_NAMES.DEPOSITO,
    );

    // Cria a transação de depósito
    return this.create(
      {
        portfolioId,
        transactionTypeId: TRANSACTION_TYPE_IDS.ENTRADA,
        transactionReasonId: depositReason.id,
        quantity: amount,
        unitPrice: 1, // Para moeda, sempre 1
        transactionDate: date,
        notes: notes || 'Depósito',
        fee: 0,
      },
      userId,
    );
  }

  /**
   * Registra um saque de moeda de um portfolio
   * @param portfolioId ID do portfolio de moeda
   * @param amount Valor do saque
   * @param date Data da transação
   * @param userId ID do usuário
   * @param notes Observações (opcional)
   * @returns Transaction criada
   */
  async createWithdrawal(
    portfolioId: number,
    amount: number,
    date: Date,
    userId: number,
    notes?: string,
  ): Promise<Transaction> {
    // Encontra o motivo de transação para saque
    const withdrawalReason = await this.transactionReasonsService.findByReason(
      TRANSACTION_REASON_NAMES.SAQUE,
    );

    // Cria a transação de saque
    return this.create(
      {
        portfolioId,
        transactionTypeId: TRANSACTION_TYPE_IDS.SAIDA,
        transactionReasonId: withdrawalReason.id,
        quantity: amount,
        unitPrice: 1, // Para moeda, sempre 1
        transactionDate: date,
        notes: notes || 'Saque',
        fee: 0,
      },
      userId,
    );
  }

  /**
   * Registra uma operação completa de compra, movimentando o dinheiro e o ativo
   * @param moneyPortfolioId ID do portfolio de moeda
   * @param assetPortfolioId ID do portfolio do ativo
   * @param quantity Quantidade do ativo
   * @param unitPrice Preço unitário do ativo
   * @param date Data da transação
   * @param userId ID do usuário
   * @param fee Taxa (opcional)
   * @param notes Observações (opcional)
   * @returns Array com as duas transações criadas [moeda, ativo]
   */
  async createBuyOperation(
    moneyPortfolioId: number,
    assetPortfolioId: number,
    quantity: number,
    unitPrice: number,
    date: Date,
    userId: number,
    fee: number = 0,
    notes?: string,
  ): Promise<Transaction[]> {
    // Encontra o motivo de transação para compra
    const buyReason = await this.transactionReasonsService.findByReason(
      TRANSACTION_REASON_NAMES.COMPRA,
    );
    const totalAmount = quantity * unitPrice + fee;

    // Cria a transação de saída de dinheiro
    const moneyTransaction = await this.create(
      {
        portfolioId: moneyPortfolioId,
        transactionTypeId: TRANSACTION_TYPE_IDS.SAIDA,
        transactionReasonId: buyReason.id,
        quantity: totalAmount,
        unitPrice: 1, // Para moeda, sempre 1
        transactionDate: date,
        notes: notes || 'Compra',
        fee: 0, // O fee já está no total
      },
      userId,
    );

    // Cria a transação de entrada do ativo
    const assetTransaction = await this.create(
      {
        portfolioId: assetPortfolioId,
        transactionTypeId: TRANSACTION_TYPE_IDS.ENTRADA,
        transactionReasonId: buyReason.id,
        quantity: quantity,
        unitPrice: unitPrice,
        transactionDate: date,
        notes: notes || 'Compra',
        fee: fee,
      },
      userId,
    );

    return [moneyTransaction, assetTransaction];
  }

  /**
   * Registra uma operação completa de venda, movimentando o ativo e o dinheiro
   * @param assetPortfolioId ID do portfolio do ativo
   * @param moneyPortfolioId ID do portfolio de moeda
   * @param quantity Quantidade do ativo
   * @param unitPrice Preço unitário do ativo
   * @param date Data da transação
   * @param userId ID do usuário
   * @param fee Taxa (opcional)
   * @param notes Observações (opcional)
   * @returns Array com as duas transações criadas [ativo, moeda]
   */
  async createSellOperation(
    assetPortfolioId: number,
    moneyPortfolioId: number,
    quantity: number,
    unitPrice: number,
    date: Date,
    userId: number,
    fee: number = 0,
    notes?: string,
  ): Promise<Transaction[]> {
    // Encontra o motivo de transação para venda
    const sellReason = await this.transactionReasonsService.findByReason(
      TRANSACTION_REASON_NAMES.VENDA,
    );
    const totalAmount = quantity * unitPrice - fee;

    // Cria a transação de saída do ativo
    const assetTransaction = await this.create(
      {
        portfolioId: assetPortfolioId,
        transactionTypeId: TRANSACTION_TYPE_IDS.SAIDA,
        transactionReasonId: sellReason.id,
        quantity: quantity,
        unitPrice: unitPrice,
        transactionDate: date,
        notes: notes || 'Venda',
        fee: fee,
      },
      userId,
    );

    // Cria a transação de entrada de dinheiro
    const moneyTransaction = await this.create(
      {
        portfolioId: moneyPortfolioId,
        transactionTypeId: TRANSACTION_TYPE_IDS.ENTRADA,
        transactionReasonId: sellReason.id,
        quantity: totalAmount,
        unitPrice: 1, // Para moeda, sempre 1
        transactionDate: date,
        notes: notes || 'Venda',
        fee: 0, // O fee já foi descontado do total
      },
      userId,
    );

    return [assetTransaction, moneyTransaction];
  }

  /**
   * Cria uma transferência entre dois portfólios de moeda fiduciária
   * Cria duas transações vinculadas: uma saída no portfólio origem e uma entrada no destino
   * @param createTransferDto Dados da transferência
   * @param userId ID do usuário logado
   */
  async createTransfer(
    createTransferDto: CreateTransferDto,
    userId: number,
  ): Promise<{
    sourceTransaction: Transaction;
    targetTransaction: Transaction;
  }> {
    const {
      sourcePortfolioId,
      targetPortfolioId,
      quantity,
      transactionDate,
      fee = 0,
      notes,
    } = createTransferDto;

    // Valida se os portfólios existem e pertencem ao usuário
    const sourcePortfolio = await this.portfoliosService.findOne(
      sourcePortfolioId,
      userId,
    );
    const targetPortfolio = await this.portfoliosService.findOne(
      targetPortfolioId,
      userId,
    );

    // Valida se ambos os portfólios são do tipo moeda
    if (
      !CurrencyHelper.isCurrencyPortfolio(sourcePortfolio.asset.assetTypeId)
    ) {
      throw new BadRequestException(
        `Source portfolio (ID: ${sourcePortfolioId}) is not a currency portfolio`,
      );
    }

    if (
      !CurrencyHelper.isCurrencyPortfolio(targetPortfolio.asset.assetTypeId)
    ) {
      throw new BadRequestException(
        `Target portfolio (ID: ${targetPortfolioId}) is not a currency portfolio`,
      );
    }

    // Obtém as transações do portfólio de origem
    const sourceTransactions = await this.findAllByPortfolioId(
      sourcePortfolioId,
      userId,
    );

    const availableBalance =
      CurrencyHelper.calculateAvailableBalance(sourceTransactions);

    // Verifica se há saldo suficiente para a transferência
    if (availableBalance < quantity) {
      throw new BadRequestException(
        `Insufficient balance in source portfolio. Available: ${availableBalance}, Requested: ${quantity}`,
      );
    }

    // ✅ VALIDAÇÃO DE DATA: Verificar se a data não é anterior à última transação em ambos os portfólios
    await this.validateTransactionDate(sourcePortfolioId, transactionDate);
    await this.validateTransactionDate(targetPortfolioId, transactionDate);

    // Obtém as razões de transação para transferência enviada e recebida
    const sendReasonPromise = this.transactionReasonsService.findByReason(
      TRANSACTION_REASON_NAMES.TRANSFERENCIA_ENVIADA,
    );
    const receiveReasonPromise = this.transactionReasonsService.findByReason(
      TRANSACTION_REASON_NAMES.TRANSFERENCIA_RECEBIDA,
    );

    const [sendReason, receiveReason] = await Promise.all([
      sendReasonPromise,
      receiveReasonPromise,
    ]);

    // Preço unitário para moedas é sempre 1
    const unitPrice = CurrencyHelper.getDefaultUnitPrice();

    // Cria a transação de saída (transferência enviada)
    const sourceTransaction = this.repository.create({
      portfolioId: sourcePortfolioId,
      transactionTypeId: sendReason.transactionTypeId,
      transactionReasonId: sendReason.id,
      quantity,
      unitPrice,
      totalValue: quantity * unitPrice - fee,
      transactionDate,
      fee,
      notes: notes
        ? `${notes} - Transfer to portfolio #${targetPortfolioId}`
        : `Transfer to portfolio #${targetPortfolioId}`,
    });

    // Salva a transação de origem
    const savedSourceTransaction =
      await this.repository.save(sourceTransaction);

    // Cria a transação de entrada (transferência recebida)
    const targetTransaction = this.repository.create({
      portfolioId: targetPortfolioId,
      transactionTypeId: receiveReason.transactionTypeId,
      transactionReasonId: receiveReason.id,
      quantity,
      unitPrice,
      totalValue: quantity * unitPrice,
      transactionDate,
      fee: 0, // A taxa é aplicada apenas na origem
      notes: notes
        ? `${notes} - Transfer from portfolio #${sourcePortfolioId}`
        : `Transfer from portfolio #${sourcePortfolioId}`,
      linkedTransactionId: savedSourceTransaction.id,
    });

    // Salva a transação de destino
    const savedTargetTransaction =
      await this.repository.save(targetTransaction);

    // Atualiza a transação de origem com a referência para a transação de destino
    savedSourceTransaction.linkedTransactionId = savedTargetTransaction.id;
    await this.repository.save(savedSourceTransaction);

    // Recalcula os saldos dos portfolios
    await this.portfoliosService.recalculatePortfolioBalance(sourcePortfolioId);
    await this.portfoliosService.recalculatePortfolioBalance(targetPortfolioId);

    // Retorna as duas transações vinculadas
    return {
      sourceTransaction: savedSourceTransaction,
      targetTransaction: savedTargetTransaction,
    };
  }

  /**
   * Valida se a transação é a última (mais recente) transação do portfólio
   * Apenas a última transação pode ser editada para manter a integridade cronológica
   */
  async validateIsLastTransaction(
    transactionId: number,
    portfolioId: number,
  ): Promise<void> {
    const lastTransaction = await this.repository
      .createQueryBuilder('transaction')
      .where('transaction.portfolioId = :portfolioId', { portfolioId })
      .orderBy('transaction.transactionDate', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .limit(1)
      .getOne();

    if (!lastTransaction || lastTransaction.id !== transactionId) {
      throw new BadRequestException(
        'Only the most recent transaction in the portfolio can be edited. Please edit transactions in chronological order.',
      );
    }
  }
}
