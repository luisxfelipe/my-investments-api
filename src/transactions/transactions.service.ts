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
import { TransactionReason } from 'src/transaction-reasons/entities/transaction-reason.entity';
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
    // ✅ VALIDAÇÕES UNIFICADAS
    await this.validateTransactionCommon(
      createTransactionDto.portfolioId,
      createTransactionDto.transactionDate,
      userId,
    );

    // Verifica se a razão de transação existe
    const transactionReason = await this.transactionReasonsService.findOne(
      createTransactionDto.transactionReasonId,
    );

    // 🚫 BLOQUEAR CRIAÇÃO MANUAL DE TRANSFERÊNCIAS
    if (
      TransactionReasonHelper.isAnyTransfer(
        createTransactionDto.transactionReasonId,
      )
    ) {
      throw new BadRequestException(
        `Transferências não podem ser criadas individualmente através deste endpoint. ` +
          `Use o endpoint POST /transactions/transfer para criar transferências automáticas ` +
          `entre portfólios, que garante consistência e vinculação adequada das transações.`,
      );
    }

    // ✅ VALIDAÇÃO DE SALDO UNIFICADA: Se é SAÍDA → verificar saldo, Se é ENTRADA → permitir sempre
    if (TransactionTypeHelper.isSaida(transactionReason.transactionTypeId)) {
      await this.validateAvailableBalance(
        createTransactionDto.portfolioId,
        createTransactionDto.quantity,
      );
    }

    // ✅ CRIAÇÃO UNIFICADA COM CÁLCULOS
    const savedTransaction = await this.createTransactionWithCalculatedValues(
      createTransactionDto.portfolioId,
      transactionReason.transactionTypeId,
      createTransactionDto.transactionReasonId,
      createTransactionDto.quantity,
      createTransactionDto.unitPrice,
      createTransactionDto.transactionDate,
      createTransactionDto.fee || 0,
      createTransactionDto.notes,
    );

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
   * Transferência específica para moedas (REFATORADA - usando métodos unificados)
   */
  private async createCurrencyTransfer(
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

    // ✅ VALIDAÇÕES UNIFICADAS
    await this.validateTransactionCommon(
      sourcePortfolioId,
      transactionDate,
      userId,
    );
    await this.validateTransactionCommon(
      targetPortfolioId,
      transactionDate,
      userId,
    );

    // ✅ VALIDAÇÃO DE SALDO UNIFICADA
    await this.validateAvailableBalance(sourcePortfolioId, quantity, userId);

    // ✅ BUSCA DE RAZÕES UNIFICADA
    const { sendReason, receiveReason } = await this.getTransferReasons();

    const unitPrice = CurrencyHelper.getDefaultUnitPrice();

    // ✅ CRIAR TRANSAÇÃO DE ORIGEM COM MÉTODO UNIFICADO
    const sourceTransaction = await this.createTransactionWithCalculatedValues(
      sourcePortfolioId,
      sendReason.transactionTypeId,
      sendReason.id,
      quantity,
      unitPrice,
      transactionDate,
      fee,
      notes
        ? `${notes} - Transfer to portfolio #${targetPortfolioId}`
        : `Transfer to portfolio #${targetPortfolioId}`,
    );

    // ✅ CRIAR TRANSAÇÃO DE DESTINO COM MÉTODO UNIFICADO
    const targetTransaction = await this.createTransactionWithCalculatedValues(
      targetPortfolioId,
      receiveReason.transactionTypeId,
      receiveReason.id,
      quantity,
      unitPrice,
      transactionDate,
      0, // Taxa aplicada apenas na origem
      notes
        ? `${notes} - Transfer from portfolio #${sourcePortfolioId}`
        : `Transfer from portfolio #${sourcePortfolioId}`,
      sourceTransaction.id, // linkedTransactionId
    );

    // Vincular transações
    sourceTransaction.linkedTransactionId = targetTransaction.id;
    await this.repository.save(sourceTransaction);

    console.log(`🏦 Currency transfer completed: ${quantity} units`);

    return {
      sourceTransaction,
      targetTransaction,
    };
  }

  /**
   * ✅ REFATORADO: Transferência específica para ativos usando métodos auxiliares unificados
   * Elimina duplicações usando validateTransactionCommon(), validateAvailableBalance(),
   * getTransferReasons() e createTransactionWithCalculatedValues()
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

    console.log(
      `🔄 Creating asset transfer: ${quantity} units at ${unitPrice} from portfolio ${sourcePortfolioId} to ${targetPortfolioId}`,
    );

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

    // ✅ VALIDAÇÃO UNIFICADA: Usar método auxiliar para validar data
    await this.validateTransactionCommon(
      sourcePortfolioId,
      transactionDate,
      userId,
    );
    await this.validateTransactionCommon(
      targetPortfolioId,
      transactionDate,
      userId,
    );

    // ✅ VALIDAÇÃO UNIFICADA: Usar método auxiliar para validar saldo disponível
    await this.validateAvailableBalance(sourcePortfolioId, quantity, userId);

    // ✅ BUSCA UNIFICADA: Usar método auxiliar para obter razões de transferência
    const { sendReason, receiveReason } = await this.getTransferReasons();

    // ✅ CRIAÇÃO UNIFICADA: Usar método auxiliar para criar transação de origem
    const savedSourceTransaction =
      await this.createTransactionWithCalculatedValues(
        sourcePortfolioId,
        sendReason.transactionTypeId,
        sendReason.id,
        quantity,
        unitPrice!,
        transactionDate,
        fee,
        notes
          ? `${notes} - Transfer to portfolio #${targetPortfolioId}`
          : `Transfer to portfolio #${targetPortfolioId}`,
      );

    // ✅ CRIAÇÃO UNIFICADA: Usar método auxiliar para criar transação de destino
    const savedTargetTransaction =
      await this.createTransactionWithCalculatedValues(
        targetPortfolioId,
        receiveReason.transactionTypeId,
        receiveReason.id,
        quantity,
        unitPrice!,
        transactionDate,
        0, // Taxa aplicada apenas na origem
        notes
          ? `${notes} - Transfer from portfolio #${sourcePortfolioId}`
          : `Transfer from portfolio #${sourcePortfolioId}`,
        savedSourceTransaction.id, // linkedTransactionId
      );

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
   * ✅ MÉTODO AUXILIAR UNIFICADO: Executa todas as validações comuns para transações
   * Elimina duplicação entre create(), update(), createCurrencyTransfer(), createAssetTransfer()
   */
  private async validateTransactionCommon(
    portfolioId: number,
    transactionDate: Date,
    userId: number,
    excludeTransactionId?: number,
  ): Promise<void> {
    // ✅ Validação de acesso ao portfolio
    await this.validatePortfolioAccess(portfolioId, userId);

    // ✅ Validação de data
    await this.validateTransactionDate(
      portfolioId,
      transactionDate,
      excludeTransactionId,
    );
  }

  /**
   * ✅ MÉTODO AUXILIAR UNIFICADO: Valida saldo disponível de forma consistente
   * Elimina diferentes implementações entre create(), createCurrencyTransfer(), createAssetTransfer()
   */
  private async validateAvailableBalance(
    portfolioId: number,
    requiredQuantity: number,
    userId?: number,
  ): Promise<void> {
    const transactions = await this.findAllByPortfolioId(portfolioId, userId);

    if (transactions.length === 0) {
      throw new BadRequestException(
        `Portfolio has no transactions or insufficient balance`,
      );
    }

    const validationResult = this.validateTransaction(
      transactions,
      'SELL',
      requiredQuantity,
    );

    if (!validationResult.isValid) {
      throw new BadRequestException(validationResult.message);
    }
  }

  /**
   * ✅ MÉTODO AUXILIAR UNIFICADO: Busca razões de transação para transferências
   * Elimina duplicação entre createCurrencyTransfer() e createAssetTransfer()
   */
  private async getTransferReasons(): Promise<{
    sendReason: TransactionReason;
    receiveReason: TransactionReason;
  }> {
    const [sendReason, receiveReason] = await Promise.all([
      this.transactionReasonsService.findByReason(
        TRANSACTION_REASON_NAMES.TRANSFERENCIA_ENVIADA,
      ),
      this.transactionReasonsService.findByReason(
        TRANSACTION_REASON_NAMES.TRANSFERENCIA_RECEBIDA,
      ),
    ]);

    return { sendReason, receiveReason };
  }

  /**
   * ✅ MÉTODO AUXILIAR UNIFICADO: Cria transação usando método unificado de cálculo
   * Elimina duplicação de criação manual entre todos os métodos
   */
  private async createTransactionWithCalculatedValues(
    portfolioId: number,
    transactionTypeId: number,
    transactionReasonId: number,
    quantity: number,
    unitPrice: number,
    transactionDate: Date,
    fee: number = 0,
    notes?: string,
    linkedTransactionId?: number,
  ): Promise<Transaction> {
    // ✅ CÁLCULOS UNIFICADOS
    const calculatedValues = await this.calculateTransactionValues(
      portfolioId,
      quantity,
      unitPrice,
      fee,
      transactionReasonId,
      transactionTypeId,
    );

    // ✅ CRIAR TRANSAÇÃO COM VALORES CALCULADOS
    const transaction = this.repository.create({
      portfolioId,
      transactionTypeId,
      transactionReasonId,
      quantity,
      unitPrice,
      transactionDate,
      fee,
      notes,
      linkedTransactionId,
      ...calculatedValues, // totalValue, currentBalance, averagePrice
    });

    return await this.repository.save(transaction);
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
