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

    // ✅ VALIDAÇÃO SIMPLES: Se é SAÍDA → verificar saldo, Se é ENTRADA → permitir sempre
    if (TransactionTypeHelper.isSaida(transactionReason.transactionTypeId)) {
      const existingTransactions = await this.findAllByPortfolioId(
        createTransactionDto.portfolioId,
      );

      const validationResult = this.validateTransaction(
        existingTransactions,
        'SELL',
        createTransactionDto.quantity,
      );

      if (!validationResult.isValid) {
        throw new BadRequestException(validationResult.message);
      }
    }

    // 🧮 CÁLCULO UNIFICADO - Garantir consistência com update()
    const calculatedValues = await this.calculateTransactionValues(
      createTransactionDto.portfolioId,
      createTransactionDto.quantity,
      createTransactionDto.unitPrice,
      createTransactionDto.fee || 0,
      createTransactionDto.transactionReasonId,
      transactionReason.transactionTypeId,
    );

    const transaction = this.repository.create({
      ...createTransactionDto,
      ...calculatedValues, // totalValue, currentBalance, averagePrice
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

    // 🔒 PROTEÇÃO: Bloquear alterações em transferências (exceto notes)
    if (
      TransactionReasonHelper.isAnyTransfer(transaction.transactionReasonId)
    ) {
      // Permitir apenas alteração de observações
      const allowedFields = ['notes'];
      const providedFields = Object.keys(updateTransactionDto);
      const blockedFields = providedFields.filter(
        (field) => !allowedFields.includes(field),
      );

      if (blockedFields.length > 0) {
        throw new BadRequestException(
          `Transações de transferência não podem ser alteradas. ` +
            `Apenas observações (notes) podem ser editadas. ` +
            `Campos bloqueados: ${blockedFields.join(', ')}. ` +
            `Para corrigir, exclua e crie uma nova transferência.`,
        );
      }
    }

    // ✅ VALIDAÇÃO DE ORDEM CRONOLÓGICA: Verificar se é a última transação do portfólio
    await this.validateIsLastTransaction(id, transaction.portfolioId);

    // ✅ VALIDAÇÃO SEGURA: Verificar se o portfolio da transação ainda existe e pertence ao usuário
    await this.validatePortfolioAccess(transaction.portfolioId, userId);

    // ✅ VALIDAÇÃO DE DATA: Verificar se a nova data não é anterior à última transação
    if (updateTransactionDto.transactionDate) {
      await this.validateTransactionDate(
        transaction.portfolioId,
        updateTransactionDto.transactionDate,
        id, // Excluir a transação atual da validação
      );
    }

    // 🧮 DETECTAR NECESSIDADE DE RECÁLCULO
    const needsRecalculation = this.shouldRecalculate(
      transaction,
      updateTransactionDto,
    );

    // 🧮 USAR MÉTODO UNIFICADO PARA CALCULAR VALORES
    let calculatedValues: {
      totalValue?: number;
      currentBalance?: number;
      averagePrice?: number;
    } = {};

    if (needsRecalculation.totalValue || needsRecalculation.balanceAndPrice) {
      console.log(`🔄 Recalculando transação ${id}:`, needsRecalculation);
      calculatedValues = await this.calculateTransactionValues(
        transaction.portfolioId,
        updateTransactionDto.quantity ?? transaction.quantity,
        updateTransactionDto.unitPrice ?? transaction.unitPrice,
        updateTransactionDto.fee ?? transaction.fee ?? 0,
        transaction.transactionReasonId, // Não pode ser alterado
        transaction.transactionTypeId, // Não pode ser alterado
      );
    }

    // Merge dos dados atualizados
    this.repository.merge(transaction, {
      ...updateTransactionDto,
      ...calculatedValues,
    });
    const updatedTransaction = await this.repository.save(transaction);

    // ♻️ RECÁLCULO CONDICIONAL: Apenas se houve mudanças que afetam outras transações
    if (needsRecalculation.balanceAndPrice) {
      console.log(
        `🔄 Recalculando portfolio ${transaction.portfolioId} após alteração da transação ${id}`,
      );
      await this.recalculateTransactionBalances(transaction.portfolioId);
    }

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
   * Cria transferência unificada - detecta automaticamente se é moeda ou ativo
   * @param createTransferDto Dados da transferência
   * @param userId ID do usuário
   */
  async createUnifiedTransfer(
    createTransferDto: CreateTransferDto,
    userId: number,
  ): Promise<{
    sourceTransaction: Transaction;
    targetTransaction: Transaction;
  }> {
    const { sourcePortfolioId, targetPortfolioId, unitPrice } =
      createTransferDto;

    // 🔍 VALIDAÇÕES INICIAIS
    const sourcePortfolio = await this.portfoliosService.findOne(
      sourcePortfolioId,
      userId,
    );
    const targetPortfolio = await this.portfoliosService.findOne(
      targetPortfolioId,
      userId,
    );

    // ✅ VALIDAR SE SÃO DO MESMO ATIVO
    if (sourcePortfolio.assetId !== targetPortfolio.assetId) {
      throw new BadRequestException(
        `Cannot transfer between different assets. ` +
          `Source: ${sourcePortfolio.asset.name}, Target: ${targetPortfolio.asset.name}`,
      );
    }

    // 🧠 DETECÇÃO AUTOMÁTICA DO TIPO
    const isCurrencyTransfer = CurrencyHelper.isCurrencyPortfolio(
      sourcePortfolio.asset.assetTypeId,
    );

    if (isCurrencyTransfer) {
      // 💰 TRANSFERÊNCIA DE MOEDA
      console.log(`🏦 Currency transfer: ${sourcePortfolio.asset.code}`);

      // Para moedas, unitPrice é sempre 1 ou pode ser omitido
      const finalDto = {
        ...createTransferDto,
        unitPrice: CurrencyHelper.getDefaultUnitPrice(), // Sempre 1 para moedas
      };

      return await this.createCurrencyTransfer(finalDto, userId);
    } else {
      // 🪙 TRANSFERÊNCIA DE ATIVO
      console.log(`💎 Asset transfer: ${sourcePortfolio.asset.code}`);

      // Para ativos, unitPrice é obrigatório
      if (!unitPrice) {
        throw new BadRequestException(
          `Unit price is required for ${sourcePortfolio.asset.name} transfers`,
        );
      }

      return await this.createAssetTransfer(createTransferDto, userId);
    }
  }

  /**
   * Transferência específica para moedas (lógica atual)
   */
  private async createCurrencyTransfer(
    createTransferDto: CreateTransferDto,
    userId: number,
  ): Promise<{
    sourceTransaction: Transaction;
    targetTransaction: Transaction;
  }> {
    // 💰 Usar lógica atual do createTransfer
    return await this.createTransfer(createTransferDto, userId);
  }

  /**
   * Transferência específica para ativos não-monetários
   */
  private async createAssetTransfer(
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
      unitPrice,
      transactionDate,
      fee = 0,
      notes,
    } = createTransferDto;

    // 🔍 VALIDAÇÕES ESPECÍFICAS PARA ATIVOS
    const sourcePortfolio = await this.portfoliosService.findOne(
      sourcePortfolioId,
      userId,
    );
    const targetPortfolio = await this.portfoliosService.findOne(
      targetPortfolioId,
      userId,
    );

    // Validar se ambos são ativos (não moedas)
    if (CurrencyHelper.isCurrencyPortfolio(sourcePortfolio.asset.assetTypeId)) {
      throw new BadRequestException(
        `Source portfolio (ID: ${sourcePortfolioId}) is a currency portfolio. Use currency transfer logic.`,
      );
    }

    if (CurrencyHelper.isCurrencyPortfolio(targetPortfolio.asset.assetTypeId)) {
      throw new BadRequestException(
        `Target portfolio (ID: ${targetPortfolioId}) is a currency portfolio. Use currency transfer logic.`,
      );
    }

    // Verificar saldo disponível usando o serviço de cálculos financeiros
    const sourceTransactions = await this.findAllByPortfolioId(
      sourcePortfolioId,
      userId,
    );

    if (sourceTransactions.length > 0) {
      const availableBalance =
        this.financialCalculationsService.calculatePositionMetrics(
          sourceTransactions,
        ).quantity;

      if (availableBalance < quantity) {
        throw new BadRequestException(
          `Insufficient balance in source portfolio. Available: ${availableBalance}, Requested: ${quantity}`,
        );
      }
    } else {
      throw new BadRequestException(
        `Source portfolio has no transactions or insufficient balance`,
      );
    }

    // ✅ VALIDAÇÃO DE DATA
    await this.validateTransactionDate(sourcePortfolioId, transactionDate);
    await this.validateTransactionDate(targetPortfolioId, transactionDate);

    // Obter razões de transação para transferência
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

    // 🧮 CALCULAR VALORES PARA TRANSAÇÃO DE ORIGEM (SAÍDA)
    const sourceValues = await this.calculateTransactionValues(
      sourcePortfolioId,
      quantity,
      unitPrice!,
      fee,
      sendReason.id,
      sendReason.transactionTypeId,
    );

    // Criar transação de saída
    const sourceTransaction = this.repository.create({
      portfolioId: sourcePortfolioId,
      transactionTypeId: sendReason.transactionTypeId,
      transactionReasonId: sendReason.id,
      quantity,
      unitPrice: unitPrice!,
      totalValue: sourceValues.totalValue,
      transactionDate,
      fee,
      notes: notes
        ? `${notes} - Transfer to portfolio #${targetPortfolioId}`
        : `Transfer to portfolio #${targetPortfolioId}`,
      currentBalance: sourceValues.currentBalance,
      averagePrice: sourceValues.averagePrice,
    });

    // Salvar transação de origem
    const savedSourceTransaction =
      await this.repository.save(sourceTransaction);

    // 🧮 CALCULAR VALORES PARA TRANSAÇÃO DE DESTINO (ENTRADA)
    const targetValues = await this.calculateTransactionValues(
      targetPortfolioId,
      quantity,
      unitPrice!,
      0, // Taxa aplicada apenas na origem
      receiveReason.id,
      receiveReason.transactionTypeId,
    );

    // Criar transação de destino
    const targetTransaction = this.repository.create({
      portfolioId: targetPortfolioId,
      transactionTypeId: receiveReason.transactionTypeId,
      transactionReasonId: receiveReason.id,
      quantity,
      unitPrice: unitPrice!,
      totalValue: targetValues.totalValue,
      transactionDate,
      fee: 0, // Taxa aplicada apenas na origem
      notes: notes
        ? `${notes} - Transfer from portfolio #${sourcePortfolioId}`
        : `Transfer from portfolio #${sourcePortfolioId}`,
      linkedTransactionId: savedSourceTransaction.id,
      currentBalance: targetValues.currentBalance,
      averagePrice: targetValues.averagePrice,
    });

    // Salvar transação de destino
    const savedTargetTransaction =
      await this.repository.save(targetTransaction);

    // Atualizar transação de origem com referência para a de destino
    savedSourceTransaction.linkedTransactionId = savedTargetTransaction.id;
    await this.repository.save(savedSourceTransaction);

    console.log(
      `💎 Asset transfer completed: ${quantity} ${sourcePortfolio.asset.code} at ${unitPrice} each`,
    );

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
   * Calcula todos os valores de uma transação (totalValue, currentBalance, averagePrice)
   * Método unificado para garantir consistência entre create() e update()
   * @param portfolioId ID do portfolio
   * @param quantity Quantidade da transação
   * @param unitPrice Preço unitário
   * @param fee Taxa da transação
   * @param transactionReasonId ID da razão da transação
   * @param transactionTypeId ID do tipo da transação
   * @returns Objeto com todos os valores calculados
   */
  private async calculateTransactionValues(
    portfolioId: number,
    quantity: number,
    unitPrice: number,
    fee: number = 0,
    transactionReasonId: number,
    transactionTypeId: number,
  ): Promise<{
    totalValue: number;
    currentBalance: number;
    averagePrice: number;
  }> {
    // 1. Calcular totalValue (sempre igual)
    const totalValue = quantity * unitPrice - fee;

    // 2. Calcular currentBalance e averagePrice (reutilizar lógica existente)
    const { newBalance, newAvgPrice } = await this.calculateBalanceAndPrice(
      portfolioId,
      quantity,
      unitPrice,
      transactionReasonId,
      transactionTypeId,
    );

    return {
      totalValue,
      currentBalance: newBalance,
      averagePrice: newAvgPrice,
    };
  }

  /**
   * Determina se a transação precisa de recálculo baseado nas alterações
   * @param originalTransaction Transação original
   * @param updateDto Dados de atualização
   * @returns Objeto indicando que tipos de recálculo são necessários
   */
  private shouldRecalculate(
    originalTransaction: Transaction,
    updateDto: UpdateTransactionDto,
  ): {
    totalValue: boolean;
    balanceAndPrice: boolean;
  } {
    const hasQuantityChange =
      updateDto.quantity !== undefined &&
      updateDto.quantity !== originalTransaction.quantity;

    const hasUnitPriceChange =
      updateDto.unitPrice !== undefined &&
      updateDto.unitPrice !== originalTransaction.unitPrice;

    const hasFeeChange =
      updateDto.fee !== undefined && updateDto.fee !== originalTransaction.fee;

    const hasDateChange =
      updateDto.transactionDate !== undefined &&
      updateDto.transactionDate.getTime() !==
        originalTransaction.transactionDate.getTime();

    return {
      // totalValue precisa ser recalculado se quantity, unitPrice ou fee mudaram
      totalValue: hasQuantityChange || hasUnitPriceChange || hasFeeChange,

      // currentBalance e averagePrice precisam ser recalculados se quantity, unitPrice ou date mudaram
      balanceAndPrice: hasQuantityChange || hasUnitPriceChange || hasDateChange,
    };
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
