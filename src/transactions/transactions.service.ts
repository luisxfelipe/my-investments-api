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
import { FinancialCalculationsService } from '../shared/services/financial-calculations.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';
import {
  TransactionTypeHelper,
  TransactionReasonHelper,
  TRANSACTION_REASON_NAMES,
} from 'src/constants/transaction-types.constants';
import { CurrencyHelper } from 'src/constants/currency.helper';

/**
 * Interface para resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  availableBalance?: number;
}

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
    private readonly financialCalculationsService: FinancialCalculationsService, // Injetar o serviço de cálculos financeiros
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    userId: number,
  ): Promise<Transaction> {
    // Validar portfólio e permissões
    await this.validatePortfolioAccess(
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
      // Verificar se o portfolio existe e pertence ao usuário
      await this.portfoliosService.findOne(
        createTransactionDto.portfolioId,
        userId,
      );

      // Buscar transações e validar saldo disponível
      const transactions = await this.findAllByPortfolioId(
        createTransactionDto.portfolioId,
      );
      const validationResult = this.validateTransaction(
        transactions,
        'SELL',
        createTransactionDto.quantity,
      );

      if (!validationResult.isValid) {
        throw new BadRequestException(validationResult.message);
      }
    }

    // Calcular novos valores de saldo e preço médio
    const { newBalance, newAvgPrice } = await this.calculateBalanceAndPrice(
      createTransactionDto.portfolioId,
      createTransactionDto.quantity,
      createTransactionDto.unitPrice,
      createTransactionDto.transactionReasonId,
      transactionReason.transactionTypeId,
    );

    const transaction = this.repository.create({
      ...createTransactionDto,
      totalValue:
        createTransactionDto.quantity * createTransactionDto.unitPrice -
        (createTransactionDto.fee || 0),
      currentBalance: newBalance,
      averagePrice: newAvgPrice,
    });

    const savedTransaction = await this.repository.save(transaction);

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
    await this.validatePortfolioAccess(transaction.portfolioId, userId);

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

        // Calcular saldo total sem a transação atual
        let balanceWithoutCurrent = 0;
        let currentAvgPrice = 0;

        for (const t of transactionsWithoutCurrent) {
          const transactionReason =
            await this.transactionReasonsService.findOne(t.transactionReasonId);
          const result = this.calculateBalanceAndPriceFromValues(
            balanceWithoutCurrent,
            currentAvgPrice,
            t.quantity,
            t.unitPrice,
            t.transactionReasonId,
            transactionReason.transactionTypeId,
          );
          balanceWithoutCurrent = result.newBalance;
          currentAvgPrice = result.newAvgPrice;
        }

        if (balanceWithoutCurrent < newTransactionQuantity) {
          throw new BadRequestException(
            `Insufficient balance for sale. ` +
              `Available: ${balanceWithoutCurrent}, ` +
              `Attempted: ${newTransactionQuantity}`,
          );
        }
      } else {
        // Para mudança para venda ou nova venda, usar validação segura
        // Verificar se o portfolio existe e pertence ao usuário
        await this.portfoliosService.findOne(portfolioId, userId);

        // Buscar transações e validar saldo disponível
        const transactions = await this.findAllByPortfolioId(portfolioId);
        const validationResult = this.validateTransaction(
          transactions,
          'SELL',
          newTransactionQuantity,
        );

        if (!validationResult.isValid) {
          throw new BadRequestException(validationResult.message);
        }
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

    // Recalcular todos os saldos e preços médios do portfólio
    // já que alterar uma transação impacta todas as subsequentes
    await this.recalculateTransactionBalances(transaction.portfolioId);

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

    // Recalcular saldo e preço médio de todas as transações após a exclusão
    await this.recalculateTransactionBalances(portfolioId);
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
   * Valida se uma transação pode ser executada baseada no saldo disponível
   * @param portfolioTransactions Lista de transações do portfolio
   * @param transactionType Tipo de transação (BUY, SELL, TRANSFER)
   * @param amount Quantidade a ser transacionada
   * @returns Resultado da validação
   */
  validateTransaction(
    portfolioTransactions: Transaction[],
    transactionType: 'BUY' | 'SELL' | 'TRANSFER',
    amount: number,
  ): ValidationResult {
    if (transactionType === 'SELL' || transactionType === 'TRANSFER') {
      // Para vendas/transferências, verificar saldo disponível
      const assetMetrics =
        this.financialCalculationsService.calculatePositionMetrics(
          portfolioTransactions,
        );
      const availableBalance = assetMetrics.quantity;

      if (availableBalance < amount) {
        return {
          isValid: false,
          message: `Saldo insuficiente. Disponível: ${availableBalance}, Necessário: ${amount}`,
          availableBalance,
        };
      }
    }

    return {
      isValid: true,
      availableBalance:
        portfolioTransactions.length > 0
          ? this.financialCalculationsService.calculatePositionMetrics(
              portfolioTransactions,
            ).quantity
          : 0,
    };
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

    // Calcular saldo e preço médio para transação de origem (saída)
    const { newBalance: newSourceBalance, newAvgPrice: sourceAvgPrice } =
      await this.calculateBalanceAndPrice(
        sourcePortfolioId,
        quantity,
        unitPrice,
        sendReason.id,
        sendReason.transactionTypeId,
      );

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
      currentBalance: newSourceBalance,
      averagePrice: sourceAvgPrice,
    });

    // Salva a transação de origem
    const savedSourceTransaction =
      await this.repository.save(sourceTransaction);

    // Calcular saldo e preço médio para transação de destino (entrada)
    const { newBalance: newTargetBalance, newAvgPrice: targetAvgPrice } =
      await this.calculateBalanceAndPrice(
        targetPortfolioId,
        quantity,
        unitPrice,
        receiveReason.id,
        receiveReason.transactionTypeId,
      );

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
      currentBalance: newTargetBalance,
      averagePrice: targetAvgPrice,
    });

    // Salva a transação de destino
    const savedTargetTransaction =
      await this.repository.save(targetTransaction);

    // Atualiza a transação de origem com a referência para a transação de destino
    savedSourceTransaction.linkedTransactionId = savedTargetTransaction.id;
    await this.repository.save(savedSourceTransaction);

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

  /**
   * Encontra a última transação para um portfolio específico
   * @param portfolioId ID do portfolio
   * @returns A última transação ou null se não houver nenhuma
   */
  async findLastTransactionForPortfolio(
    portfolioId: number,
  ): Promise<Transaction | null> {
    return this.repository
      .createQueryBuilder('transaction')
      .where('transaction.portfolioId = :portfolioId', { portfolioId })
      .orderBy('transaction.transactionDate', 'DESC')
      .addOrderBy('transaction.id', 'DESC')
      .getOne();
  }

  /**
   * Recalcula os campos currentBalance e averagePrice para todas as transações
   * de um portfolio em ordem cronológica
   * @param portfolioId ID do portfolio
   */
  async recalculateTransactionBalances(portfolioId: number): Promise<void> {
    // Buscar todas as transações deste portfolio ordenadas por data
    const transactions = await this.repository.find({
      where: { portfolioId },
      order: {
        transactionDate: 'ASC',
        id: 'ASC', // Em caso de mesma data, usar ID para desempate
      },
    });

    if (transactions.length === 0) {
      return;
    }

    let currentBalance = 0;
    let currentAveragePrice = 0;

    // Processar cada transação em ordem cronológica
    for (const transaction of transactions) {
      const transactionReason = await this.transactionReasonsService.findOne(
        transaction.transactionReasonId,
      );

      // Usar método helper para calcular saldo e preço médio
      const result = this.calculateBalanceAndPriceFromValues(
        currentBalance,
        currentAveragePrice,
        transaction.quantity,
        transaction.unitPrice,
        transaction.transactionReasonId,
        transactionReason.transactionTypeId,
      );

      currentBalance = result.newBalance;
      currentAveragePrice = result.newAvgPrice;

      // Atualizar a transação com os valores recalculados
      await this.repository.update(transaction.id, {
        currentBalance,
        averagePrice: currentAveragePrice,
      });
    }
  }

  /**
   * Valida se o portfolio existe e se o usuário tem acesso a ele
   * @param portfolioId ID do portfolio
   * @param userId ID do usuário
   */
  private async validatePortfolioAccess(
    portfolioId: number,
    userId: number,
  ): Promise<void> {
    await this.portfoliosService.findOne(portfolioId, userId);
  }

  /**
   * Calcula o novo saldo e preço médio baseado na última transação do portfólio
   * @param portfolioId ID do portfolio
   * @param quantity Quantidade da nova transação
   * @param unitPrice Preço unitário da nova transação
   * @param transactionReasonId ID da razão da transação
   * @param transactionTypeId ID do tipo da transação
   * @returns Objeto com newBalance e newAvgPrice
   */
  private async calculateBalanceAndPrice(
    portfolioId: number,
    quantity: number,
    unitPrice: number,
    transactionReasonId: number,
    transactionTypeId: number,
  ): Promise<{ newBalance: number; newAvgPrice: number }> {
    // Obter a última transação para esse portfólio
    const lastTransaction =
      await this.findLastTransactionForPortfolio(portfolioId);

    // Determinar saldo e preço médio atuais
    const currentBalance = lastTransaction ? lastTransaction.currentBalance : 0;
    const currentAvgPrice = lastTransaction ? lastTransaction.averagePrice : 0;

    return this.calculateBalanceAndPriceFromValues(
      currentBalance,
      currentAvgPrice,
      quantity,
      unitPrice,
      transactionReasonId,
      transactionTypeId,
    );
  }

  /**
   * Calcula novo saldo e preço médio baseado em valores fornecidos
   * @param currentBalance Saldo atual
   * @param currentAvgPrice Preço médio atual
   * @param quantity Quantidade da transação
   * @param unitPrice Preço unitário da transação
   * @param transactionReasonId ID da razão da transação
   * @param transactionTypeId ID do tipo da transação
   * @returns Objeto com newBalance e newAvgPrice
   */
  private calculateBalanceAndPriceFromValues(
    currentBalance: number,
    currentAvgPrice: number,
    quantity: number,
    unitPrice: number,
    transactionReasonId: number,
    transactionTypeId: number,
  ): { newBalance: number; newAvgPrice: number } {
    let newBalance: number;
    let newAvgPrice: number;

    if (TransactionTypeHelper.isEntrada(transactionTypeId)) {
      // Entrada (compra, depósito, etc)
      newBalance = Number(currentBalance) + Number(quantity);

      if (TransactionReasonHelper.isCompra(transactionReasonId)) {
        // Atualiza preço médio apenas para compras usando preço médio ponderado
        const totalCurrentValue =
          Number(currentBalance) * Number(currentAvgPrice);
        const newPurchaseValue = Number(quantity) * Number(unitPrice);

        newAvgPrice =
          newBalance > 0
            ? (totalCurrentValue + newPurchaseValue) / newBalance
            : 0;
      } else {
        // Mantém preço médio para outros tipos de entrada (depósitos, transferências recebidas)
        newAvgPrice = currentBalance > 0 ? currentAvgPrice : 0;
      }
    } else {
      // Saída (venda, retirada, etc)
      newBalance = Number(currentBalance) - Number(quantity);
      // Preço médio não muda em vendas/saídas, exceto se saldo zerado
      newAvgPrice = newBalance > 0 ? currentAvgPrice : 0;
      // Previne saldo negativo
      if (newBalance < 0) {
        newBalance = 0;
      }
    }

    return { newBalance, newAvgPrice };
  }
}
