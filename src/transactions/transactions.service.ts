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
import { CreateExchangeDto } from './dto/create-exchange.dto';
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

    // 🚫 BLOQUEAR CRIAÇÃO MANUAL DE EXCHANGES (COMPRA/VENDA)
    if (
      TransactionReasonHelper.isExchange(
        createTransactionDto.transactionReasonId,
      )
    ) {
      throw new BadRequestException(
        `Exchanges (compra/venda) não podem ser criados individualmente através deste endpoint. ` +
          `Use o endpoint POST /transactions/exchange para criar exchanges automáticos ` +
          `entre diferentes ativos, que garante conservação de valor e validações adequadas.`,
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

    // 🔒 PROTEÇÃO: Bloquear alterações em exchanges (exceto notes)
    if (TransactionReasonHelper.isExchange(transaction.transactionReasonId)) {
      // Permitir apenas alteração de observações
      const allowedFields = ['notes'];
      const providedFields = Object.keys(updateTransactionDto);
      const blockedFields = providedFields.filter(
        (field) => !allowedFields.includes(field),
      );

      if (blockedFields.length > 0) {
        throw new BadRequestException(
          `Exchange transactions cannot be modified. ` +
            `Only notes can be edited to maintain data integrity and linked transaction consistency. ` +
            `Blocked fields: ${blockedFields.join(', ')}. ` +
            `To modify the exchange, delete it via DELETE /transactions/exchange/${id} and create a new one.`,
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

    // ❌ BLOQUEAR EXCLUSÃO DE TRANSFERÊNCIAS VIA DELETE NORMAL
    const isTransfer = TransactionReasonHelper.isAnyTransfer(
      transaction.transactionReasonId,
    );

    if (isTransfer) {
      throw new BadRequestException(
        `Cannot delete transfer transactions individually. ` +
          `Transfer transactions must be deleted as a complete unit to maintain data integrity. ` +
          `Use DELETE /transactions/transfer/${id} to remove the complete transfer safely.`,
      );
    }

    // ❌ BLOQUEAR EXCLUSÃO DE EXCHANGES VIA DELETE NORMAL
    const isExchange = TransactionReasonHelper.isExchange(
      transaction.transactionReasonId,
    );

    if (isExchange) {
      throw new BadRequestException(
        `Cannot delete exchange transactions individually. ` +
          `Exchange transactions must be deleted as a complete unit to maintain data integrity. ` +
          `Use DELETE /transactions/exchange/${id} to remove the complete exchange safely.`,
      );
    }

    // ✅ VALIDAÇÃO DE ORDEM CRONOLÓGICA: Verificar se é a última transação do portfólio
    await this.validateIsLastTransaction(id, transaction.portfolioId);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);

    // Recalcular saldo e preço médio de todas as transações após a exclusão
    await this.recalculateTransactionBalances(portfolioId);
  }

  /**
   * Remove transferência completa (ambas as transações vinculadas)
   * Usa transação de banco de dados para garantir atomicidade
   * @param transferId ID de qualquer uma das transações da transferência
   * @param userId ID do usuário
   */
  async removeTransfer(transferId: number, userId: number): Promise<void> {
    return await this.repository.manager.transaction(async (manager) => {
      // 🔍 BUSCAR A TRANSAÇÃO PRINCIPAL
      const transaction = await manager
        .createQueryBuilder(Transaction, 'transaction')
        .leftJoinAndSelect('transaction.portfolio', 'portfolio')
        .leftJoinAndSelect('portfolio.asset', 'asset')
        .where('transaction.id = :transferId', { transferId })
        .andWhere('portfolio.userId = :userId', { userId })
        .andWhere('transaction.deletedAt IS NULL')
        .getOne();

      if (!transaction) {
        throw new NotFoundException(
          `Transfer with ID ${transferId} not found or you don't have access to it`,
        );
      }

      // ✅ VERIFICAR SE É TRANSFERÊNCIA
      const isTransfer = TransactionReasonHelper.isAnyTransfer(
        transaction.transactionReasonId,
      );

      if (!isTransfer) {
        throw new BadRequestException(
          `Transaction ${transferId} is not a transfer. ` +
            `Use DELETE /transactions/${transferId} for regular transactions.`,
        );
      }

      // ✅ VERIFICAR SE TEM TRANSAÇÃO VINCULADA
      if (!transaction.linkedTransactionId) {
        throw new BadRequestException(
          `Transfer transaction ${transferId} has no linked transaction. ` +
            `This indicates a data integrity issue.`,
        );
      }

      // 🔍 BUSCAR A TRANSAÇÃO VINCULADA
      const linkedTransaction = await manager
        .createQueryBuilder(Transaction, 'transaction')
        .leftJoinAndSelect('transaction.portfolio', 'portfolio')
        .leftJoinAndSelect('portfolio.asset', 'asset')
        .where('transaction.id = :linkedId', {
          linkedId: transaction.linkedTransactionId,
        })
        .andWhere('portfolio.userId = :userId', { userId })
        .andWhere('transaction.deletedAt IS NULL')
        .getOne();

      if (!linkedTransaction) {
        throw new NotFoundException(
          `Linked transaction ${transaction.linkedTransactionId} not found. ` +
            `This indicates a data integrity issue.`,
        );
      }

      // ✅ VALIDAÇÃO ADICIONAL: Verificar se são a última transação de cada portfolio
      await this.validateIsLastTransaction(
        transaction.id,
        transaction.portfolioId,
      );
      await this.validateIsLastTransaction(
        linkedTransaction.id,
        linkedTransaction.portfolioId,
      );

      // 🗑️ SOFT DELETE DE AMBAS AS TRANSAÇÕES EM TRANSAÇÃO ATÔMICA
      const now = new Date();

      await manager.update(Transaction, transaction.id, {
        deletedAt: now,
      });

      await manager.update(Transaction, linkedTransaction.id, {
        deletedAt: now,
      });

      // 📝 LOG PARA AUDITORIA
      console.log(
        `🗑️ Complete transfer removed: ` +
          `Source transaction ${transaction.id} (${transaction.quantity} ${transaction.portfolio.asset?.code || 'units'}) ` +
          `and target transaction ${linkedTransaction.id} ` +
          `by user ${userId}`,
      );

      // ♻️ RECALCULAR SALDOS DOS PORTFOLIOS AFETADOS
      await this.recalculateTransactionBalances(transaction.portfolioId);
      if (transaction.portfolioId !== linkedTransaction.portfolioId) {
        await this.recalculateTransactionBalances(
          linkedTransaction.portfolioId,
        );
      }
    });
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
    const { sourcePortfolioId, targetPortfolioId } = createTransferDto;

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
      return await this.createCurrencyTransfer(createTransferDto, userId);
    } else {
      // 💎 TRANSFERÊNCIA DE ATIVO
      console.log(`💎 Asset transfer: ${sourcePortfolio.asset.code}`);
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
    const [sendReason, receiveReason] = await this.getReasonPair(
      TRANSACTION_REASON_NAMES.TRANSFERENCIA_ENVIADA,
      TRANSACTION_REASON_NAMES.TRANSFERENCIA_RECEBIDA,
    );

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

    // 💰 CALCULAR PREÇO UNITÁRIO AUTOMATICAMENTE BASEADO NO PREÇO MÉDIO ATUAL
    const sourceTransactions = await this.findAllByPortfolioId(
      sourcePortfolioId,
      userId,
    );
    let unitPrice = 1; // Valor padrão se não há transações

    if (sourceTransactions.length > 0) {
      const positionMetrics =
        this.financialCalculationsService.calculatePositionMetrics(
          sourceTransactions,
        );
      unitPrice = positionMetrics.averagePrice || 1; // Usar preço médio atual ou 1 se zero
    }

    console.log(
      `🔄 Creating asset transfer: ${quantity} units at ${unitPrice} (auto-calculated) from portfolio ${sourcePortfolioId} to ${targetPortfolioId}`,
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
    const [sendReason, receiveReason] = await this.getReasonPair(
      TRANSACTION_REASON_NAMES.TRANSFERENCIA_ENVIADA,
      TRANSACTION_REASON_NAMES.TRANSFERENCIA_RECEBIDA,
    );

    // ✅ CRIAÇÃO UNIFICADA: Usar método auxiliar para criar transação de origem
    const savedSourceTransaction =
      await this.createTransactionWithCalculatedValues(
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

    // ✅ CRIAÇÃO UNIFICADA: Usar método auxiliar para criar transação de destino
    const savedTargetTransaction =
      await this.createTransactionWithCalculatedValues(
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
   * ✅ MÉTODO AUXILIAR UNIFICADO: Busca um par de razões de transação
   * Usado diretamente por transfers e exchanges para eliminar duplicação
   */
  private async getReasonPair(
    firstReasonName: string,
    secondReasonName: string,
  ): Promise<[TransactionReason, TransactionReason]> {
    return await Promise.all([
      this.transactionReasonsService.findByReason(firstReasonName),
      this.transactionReasonsService.findByReason(secondReasonName),
    ]);
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
        // ✅ CORREÇÃO: Para portfolio vazio, usar o unitPrice da transação atual
        if (currentBalance > 0) {
          newAvgPrice = currentAvgPrice; // Portfolio com histórico: manter preço médio
        } else {
          newAvgPrice = unitPrice; // Portfolio vazio: usar unitPrice da primeira transação
        }
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

  // =====================================================
  // 💱 MÉTODOS DE EXCHANGE (CONVERSÃO ENTRE ATIVOS)
  // =====================================================

  /**
   * Cria exchange entre diferentes ativos
   */
  async createExchange(
    createExchangeDto: CreateExchangeDto,
    userId: number,
  ): Promise<{
    sellTransaction: Transaction;
    buyTransaction: Transaction;
  }> {
    const {
      sourcePortfolioId,
      targetPortfolioId,
      sourceQuantity,
      targetQuantity,
      exchangeRate,
      transactionDate,
      fee = 0,
      notes,
    } = createExchangeDto;

    // 🔍 VALIDAÇÕES INICIAIS
    const sourcePortfolio = await this.portfoliosService.findOne(
      sourcePortfolioId,
      userId,
    );
    const targetPortfolio = await this.portfoliosService.findOne(
      targetPortfolioId,
      userId,
    );

    // ❌ VALIDAR SE NÃO SÃO DO MESMO ATIVO
    if (sourcePortfolio.assetId === targetPortfolio.assetId) {
      throw new BadRequestException(
        `Cannot exchange same asset. Use POST /transactions/transfer for same-asset transfers.`,
      );
    }

    // ✅ VALIDAR REGRAS DE EXCHANGE
    this.validateExchangeRules(sourcePortfolio, targetPortfolio);

    // 🔒 VALIDAR MESMA PLATAFORMA (CRÍTICO)
    this.validateSamePlatform(sourcePortfolio, targetPortfolio);

    // ✅ VALIDAR SALDO DISPONÍVEL
    await this.validateAvailableBalance(
      sourcePortfolioId,
      sourceQuantity,
      userId,
    );

    // ✅ VALIDAR TAXA DE CÂMBIO
    this.validateExchangeRate(sourceQuantity, targetQuantity, exchangeRate);

    // ✅ VALIDAR DATA
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

    return await this.repository.manager.transaction(async (manager) => {
      // 🔍 BUSCAR RAZÕES DE TRANSAÇÃO
      const [sellReason, buyReason] = await this.getReasonPair(
        TRANSACTION_REASON_NAMES.VENDA,
        TRANSACTION_REASON_NAMES.COMPRA,
      );

      // 📉 CRIAR TRANSAÇÃO DE VENDA (SOURCE)
      const sellUnitPrice = this.calculateSellUnitPrice(
        sourcePortfolio,
        sourceQuantity,
        targetQuantity,
      );

      const sellTransaction = await this.createTransactionWithCalculatedValues(
        sourcePortfolioId,
        sellReason.transactionTypeId,
        sellReason.id,
        sourceQuantity,
        sellUnitPrice,
        transactionDate,
        fee,
        notes
          ? `${notes} - Exchange to ${targetPortfolio.asset.name}`
          : `Exchange to ${targetPortfolio.asset.name}`,
      );

      // 📈 CRIAR TRANSAÇÃO DE COMPRA (TARGET)
      const buyUnitPrice = this.calculateBuyUnitPrice(
        targetPortfolio,
        sourceQuantity,
        targetQuantity,
      );

      const buyTransaction = await this.createTransactionWithCalculatedValues(
        targetPortfolioId,
        buyReason.transactionTypeId,
        buyReason.id,
        targetQuantity,
        buyUnitPrice,
        transactionDate,
        0, // Fee aplicada apenas na venda
        notes
          ? `${notes} - Exchange from ${sourcePortfolio.asset.name}`
          : `Exchange from ${sourcePortfolio.asset.name}`,
        sellTransaction.id, // linkedTransactionId
      );

      // 🔗 VINCULAR TRANSAÇÕES
      sellTransaction.linkedTransactionId = buyTransaction.id;
      await manager.save(sellTransaction);

      console.log(
        `💱 Exchange completed: ${sourceQuantity} ${sourcePortfolio.asset.code} → ${targetQuantity} ${targetPortfolio.asset.code}`,
      );

      return {
        sellTransaction,
        buyTransaction,
      };
    });
  }

  /**
   * Remove exchange completo (ambas transações vinculadas)
   */
  async removeExchange(id: number, userId: number): Promise<void> {
    // Verifica se a transação existe e pertence ao usuário
    const transaction = await this.findOne(id, userId);

    // ❌ VERIFICAR SE É EXCHANGE
    const isExchange = TransactionReasonHelper.isExchange(
      transaction.transactionReasonId,
    );

    if (!isExchange) {
      throw new BadRequestException(
        `Transaction ${id} is not an exchange transaction. ` +
          `Only exchange transactions can be deleted via this endpoint.`,
      );
    }

    // 🔍 BUSCAR TRANSAÇÃO VINCULADA
    if (!transaction.linkedTransactionId) {
      throw new BadRequestException(
        `Exchange transaction ${id} does not have a linked transaction. Data integrity issue.`,
      );
    }

    const linkedTransaction = await this.findOne(
      transaction.linkedTransactionId,
      userId,
    );

    return await this.repository.manager.transaction(async (manager) => {
      // ✅ VALIDAR ORDEM CRONOLÓGICA PARA AMBAS
      await this.validateIsLastTransaction(id, transaction.portfolioId);
      await this.validateIsLastTransaction(
        linkedTransaction.id,
        linkedTransaction.portfolioId,
      );

      const portfolioIds = [
        transaction.portfolioId,
        linkedTransaction.portfolioId,
      ];

      // 🗑️ DELETAR AMBAS TRANSAÇÕES
      await manager.softDelete(Transaction, id);
      await manager.softDelete(Transaction, linkedTransaction.id);

      console.log(
        `💱 Exchange deleted: transactions ${id} and ${linkedTransaction.id}`,
      );

      // ♻️ RECALCULAR SALDOS DOS PORTFOLIOS AFETADOS
      for (const portfolioId of portfolioIds) {
        await this.recalculateTransactionBalances(portfolioId);
      }
    });
  }

  /**
   * Valida regras de exchange entre tipos de ativos
   */
  private validateExchangeRules(
    sourcePortfolio: any,
    targetPortfolio: any,
  ): void {
    const sourceType = String(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      sourcePortfolio?.asset?.assetType?.name || '',
    ).toUpperCase();
    const targetType = String(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      targetPortfolio?.asset?.assetType?.name || '',
    ).toUpperCase();

    // 📋 REGRAS PERMITIDAS
    const allowedExchanges = [
      ['CURRENCY', 'CRYPTOCURRENCY'],
      ['CRYPTOCURRENCY', 'CURRENCY'],
      ['CRYPTOCURRENCY', 'CRYPTOCURRENCY'],
      ['CURRENCY', 'STOCK'],
      ['STOCK', 'CURRENCY'],
      ['CURRENCY', 'COMMODITY'],
      ['COMMODITY', 'CURRENCY'],
    ];

    const isAllowed = allowedExchanges.some(
      ([from, to]) =>
        (sourceType === from && targetType === to) ||
        (sourceType === to && targetType === from),
    );

    if (!isAllowed) {
      throw new BadRequestException(
        `Exchange not allowed: ${sourceType} → ${targetType}. ` +
          `Allowed exchanges: Currency↔Crypto, Currency↔Stock, Currency↔Commodity, Crypto↔Crypto. ` +
          `Blocked: Stock↔Crypto, Stock↔Stock, Stock↔Commodity, Crypto↔Commodity`,
      );
    }
  }

  /**
   * 🔒 VALIDAÇÃO CRÍTICA: Valida se ambos portfolios pertencem à mesma plataforma
   * Esta validação garante que exchanges só ocorram dentro da mesma plataforma (Binance, Coinbase, etc.)
   */
  private validateSamePlatform(
    sourcePortfolio: any,
    targetPortfolio: any,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const sourcePlatformId = sourcePortfolio?.platformId as number;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const targetPlatformId = targetPortfolio?.platformId as number;

    if (!sourcePlatformId || !targetPlatformId) {
      throw new BadRequestException(
        'Cannot validate platform: One or both portfolios have missing platform information',
      );
    }

    if (sourcePlatformId !== targetPlatformId) {
      const sourcePlatformName =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (sourcePortfolio?.platform?.name as string) ||
        `Platform ID ${sourcePlatformId}`;
      const targetPlatformName =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (targetPortfolio?.platform?.name as string) ||
        `Platform ID ${targetPlatformId}`;

      throw new BadRequestException(
        `Cross-platform exchanges are not allowed. ` +
          `Source portfolio is on "${sourcePlatformName}" but target portfolio is on "${targetPlatformName}". ` +
          `Exchanges can only occur between assets within the same platform.`,
      );
    }
  }

  /**
   * Valida se a taxa de câmbio está consistente
   */
  private validateExchangeRate(
    sourceQuantity: number,
    targetQuantity: number,
    exchangeRate: number,
  ): void {
    const calculatedTargetQuantity = sourceQuantity * exchangeRate;
    const tolerance = 0.001; // 0.1% de tolerância

    if (Math.abs(calculatedTargetQuantity - targetQuantity) > tolerance) {
      throw new BadRequestException(
        `Exchange rate inconsistency. ` +
          `Expected target quantity: ${calculatedTargetQuantity.toFixed(6)}, ` +
          `but received: ${targetQuantity}. ` +
          `Exchange rate: ${exchangeRate} (${sourceQuantity} × ${exchangeRate} = ${calculatedTargetQuantity})`,
      );
    }
  }

  /**
   * Calcula preço unitário para transação de venda no exchange
   */
  private calculateSellUnitPrice(
    sourcePortfolio: any,
    sourceQuantity: number,
    targetQuantity: number,
  ): number {
    // Para venda: preço unitário baseado no valor atual em moeda base
    // Se vendendo cripto por moeda: usar taxa de câmbio
    // Se vendendo moeda por cripto: preço = 1 (valor nominal)

    const sourceType = String(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      sourcePortfolio?.asset?.assetType?.name || '',
    ).toUpperCase();

    if (sourceType === 'CURRENCY') {
      return 1; // Moedas têm valor nominal unitário
    }

    // Para criptos e outros ativos: usar valor baseado na conversão
    return targetQuantity / sourceQuantity;
  }

  /**
   * Calcula preço unitário para transação de compra no exchange
   */
  private calculateBuyUnitPrice(
    targetPortfolio: any,
    sourceQuantity: number,
    targetQuantity: number,
  ): number {
    // Para compra: preço unitário baseado no que foi pago
    const targetType = String(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      targetPortfolio?.asset?.assetType?.name || '',
    ).toUpperCase();

    if (targetType === 'CURRENCY') {
      return 1; // Moedas têm valor nominal unitário
    }

    // Para criptos e outros ativos: usar valor baseado na conversão
    return sourceQuantity / targetQuantity;
  }
}
