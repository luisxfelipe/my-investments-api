import { Injectable } from '@nestjs/common';
import { Transaction } from '../transactions/entities/transaction.entity';
import {
  TransactionTypeHelper,
  TransactionReasonHelper,
} from '../constants/transaction-types.constants';

/**
 * Interface para métricas de um ativo específico
 */
export interface AssetMetrics {
  assetId: number;
  assetName: string;
  assetSymbol: string;
  quantity: number;
  averagePrice: number;
  totalInvested: number;
  currentPrice?: number;
  currentValue: number;
  unrealizedGainLoss: number;
  unrealizedPercentage: number;
  realizedGainLoss: number;
  totalSoldValue: number;
}

/**
 * Interface para resumo de uma plataforma
 */
export interface PlatformSummary {
  totalAssets: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedGainLoss: number;
  totalUnrealizedPercentage: number;
  totalRealizedGainLoss: number;
  assetsMetrics: AssetMetrics[];
}

/**
 * Interface para resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  availableBalance?: number;
}

/**
 * Service centralizado para TODOS os cálculos financeiros de portfolio/ativo
 *
 * RESPONSABILIDADES:
 * - Centralizar algoritmo de preço médio ponderado
 * - Calcular métricas de ativos individuais
 * - Agregar métricas de múltiplos ativos
 * - Validações financeiras específicas
 *
 * ELIMINA DUPLICAÇÃO DE:
 * - PlatformsService (3 implementações do mesmo algoritmo)
 * - TransactionsService (cálculos redundantes)
 * - PortfoliosService (validações financeiras)
 */
@Injectable()
export class PortfolioCalculationsService {
  /**
   * MÉTODO PRINCIPAL - Substitui toda a lógica duplicada
   * Calcula métricas completas de um ativo baseado em suas transações
   *
   * @param transactions Lista de transações do ativo (ordenadas por data)
   * @param currentPrice Preço atual do ativo (opcional)
   * @returns Métricas completas do ativo
   */
  calculateAssetMetrics(
    transactions: Transaction[],
    currentPrice?: number,
  ): AssetMetrics {
    if (!transactions.length) {
      throw new Error('Lista de transações não pode estar vazia');
    }

    // Dados básicos do ativo (do primeiro transaction)
    const firstTransaction = transactions[0];
    const assetId = firstTransaction.portfolio.asset.id;
    const assetName = firstTransaction.portfolio.asset.name;
    const assetSymbol = firstTransaction.portfolio.asset.code;

    // Variáveis de controle para o algoritmo
    let quantity = 0;
    let averagePrice = 0;
    let totalInvested = 0;
    let totalSoldValue = 0;
    let realizedGainLoss = 0;

    // ALGORITMO ÚNICO DE PREÇO MÉDIO PONDERADO
    // (substitui as 3+ implementações duplicadas)
    for (const transaction of transactions) {
      const transactionValue = transaction.quantity * transaction.unitPrice;

      if (TransactionTypeHelper.isEntrada(transaction.transactionTypeId)) {
        // ENTRADA (compra, depósito, transferência recebida)

        if (TransactionReasonHelper.isCompra(transaction.transactionReasonId)) {
          // COMPRA: Atualiza preço médio ponderado
          const newTotalValue = totalInvested + transactionValue;
          const newQuantity = quantity + transaction.quantity;

          if (newQuantity > 0) {
            averagePrice = newTotalValue / newQuantity;
            totalInvested = newTotalValue;
          }
          quantity = newQuantity;
        } else {
          // OUTROS TIPOS DE ENTRADA: Não afeta preço médio
          quantity += transaction.quantity;
          // Mantém preço médio e total investido inalterados
        }
      } else if (TransactionTypeHelper.isSaida(transaction.transactionTypeId)) {
        // SAÍDA (venda, retirada, transferência enviada)

        if (TransactionReasonHelper.isVenda(transaction.transactionReasonId)) {
          // VENDA: Calcula ganho/perda realizado
          const soldQuantity = transaction.quantity;
          const sellPrice = transaction.unitPrice;
          const costBasis = soldQuantity * averagePrice;
          const sellValue = soldQuantity * sellPrice;

          realizedGainLoss += sellValue - costBasis;
          totalSoldValue += sellValue;

          // Reduz quantidade e total investido proporcionalmente
          quantity -= soldQuantity;
          if (quantity > 0) {
            totalInvested = quantity * averagePrice;
          } else {
            totalInvested = 0;
            averagePrice = 0;
          }
        } else {
          // OUTROS TIPOS DE SAÍDA: Apenas reduz quantidade
          quantity -= transaction.quantity;
          if (quantity <= 0) {
            quantity = 0;
            averagePrice = 0;
            totalInvested = 0;
          }
        }
      }
    }

    // Previne valores negativos
    quantity = Math.max(0, quantity);

    // CÁLCULOS DE MÉTRICAS FINAIS
    const currentValue = quantity * (currentPrice || 0);
    const unrealizedGainLoss =
      quantity > 0 ? currentValue - quantity * averagePrice : 0;
    const unrealizedPercentage =
      quantity > 0 && averagePrice > 0
        ? (unrealizedGainLoss / (quantity * averagePrice)) * 100
        : 0;

    return {
      assetId,
      assetName,
      assetSymbol,
      quantity,
      averagePrice,
      totalInvested,
      currentPrice,
      currentValue,
      unrealizedGainLoss,
      unrealizedPercentage,
      realizedGainLoss,
      totalSoldValue,
    };
  }

  /**
   * Calcula métricas agregadas de múltiplos ativos (resumo de plataforma)
   *
   * @param assetMetrics Array de métricas individuais de ativos
   * @returns Resumo consolidado da plataforma
   */
  calculatePlatformSummary(assetMetrics: AssetMetrics[]): PlatformSummary {
    const summary = assetMetrics.reduce(
      (acc, asset) => ({
        totalAssets: acc.totalAssets + 1,
        totalInvested: acc.totalInvested + asset.totalInvested,
        totalCurrentValue: acc.totalCurrentValue + asset.currentValue,
        totalUnrealizedGainLoss:
          acc.totalUnrealizedGainLoss + asset.unrealizedGainLoss,
        totalRealizedGainLoss:
          acc.totalRealizedGainLoss + asset.realizedGainLoss,
      }),
      {
        totalAssets: 0,
        totalInvested: 0,
        totalCurrentValue: 0,
        totalUnrealizedGainLoss: 0,
        totalRealizedGainLoss: 0,
      },
    );

    // Calcula percentual não realizado total
    const totalUnrealizedPercentage =
      summary.totalInvested > 0
        ? (summary.totalUnrealizedGainLoss / summary.totalInvested) * 100
        : 0;

    return {
      ...summary,
      totalUnrealizedPercentage,
      assetsMetrics: assetMetrics,
    };
  }

  /**
   * Validação financeira específica para transações
   * Centraliza validações de saldo, limites, etc.
   *
   * @param portfolioTransactions Transações do portfolio
   * @param transactionType Tipo da transação ('BUY', 'SELL', etc.)
   * @param amount Quantidade da transação
   * @returns Resultado da validação
   */
  validateTransaction(
    portfolioTransactions: Transaction[],
    transactionType: 'BUY' | 'SELL' | 'TRANSFER',
    amount: number,
  ): ValidationResult {
    if (transactionType === 'SELL' || transactionType === 'TRANSFER') {
      // Para vendas/transferências, verificar saldo disponível
      const assetMetrics = this.calculateAssetMetrics(portfolioTransactions);
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
          ? this.calculateAssetMetrics(portfolioTransactions).quantity
          : 0,
    };
  }

  /**
   * Calcula o saldo atual de um portfolio baseado em suas transações
   * Método otimizado que não precisa buscar a última transação
   *
   * @param transactions Transações do portfolio
   * @returns Saldo atual
   */
  calculateCurrentBalance(transactions: Transaction[]): number {
    if (!transactions.length) return 0;

    return this.calculateAssetMetrics(transactions).quantity;
  }

  /**
   * Calcula o preço médio atual de um portfolio baseado em suas transações
   * Método otimizado que não precisa buscar a última transação
   *
   * @param transactions Transações do portfolio
   * @returns Preço médio atual
   */
  calculateCurrentAveragePrice(transactions: Transaction[]): number {
    if (!transactions.length) return 0;

    return this.calculateAssetMetrics(transactions).averagePrice;
  }
}
