import { Injectable } from '@nestjs/common';
import { Transaction } from '../../transactions/entities/transaction.entity';
import {
  TransactionTypeHelper,
  TransactionReasonHelper,
} from '../../constants/transaction-types.constants';

/**
 * Interface para métricas de uma posição em portfolio
 * Representa a situação financeira de um ativo específico em um portfolio
 */
export interface PositionMetrics {
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
 * Service centralizado para TODOS os cálculos financeiros de portfolio/ativo
 *
 * RESPONSABILIDADES:
 * - Centralizar algoritmo de preço médio ponderado
 * - Calcular métricas de ativos individuais
 * - Validações financeiras específicas
 *
 * ELIMINA DUPLICAÇÃO DE:
 * - PlatformsService (3 implementações do mesmo algoritmo)
 * - TransactionsService (cálculos redundantes)
 * - PortfoliosService (validações financeiras)
 */
@Injectable()
export class FinancialCalculationsService {
  /**
   * MÉTODO PRINCIPAL - Calcula métricas completas de uma posição em portfolio
   * Centraliza o algoritmo de preço médio ponderado e cálculos financeiros
   *
   * @param transactions Lista de transações da posição (ordenadas por data)
   * @param currentPrice Preço atual do ativo (opcional)
   * @returns Métricas completas da posição
   */
  calculatePositionMetrics(
    transactions: Transaction[],
    currentPrice?: number,
  ): PositionMetrics {
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
   * Calcula a quantidade total de ativos em uma posição
   * Método otimizado que não precisa buscar a última transação
   *
   * @param transactions Transações da posição
   * @returns Quantidade total de ativos
   */
  calculatePositionQuantity(transactions: Transaction[]): number {
    if (!transactions.length) return 0;

    return this.calculatePositionMetrics(transactions).quantity;
  }

  /**
   * Calcula o preço médio ponderado de uma posição
   * Método otimizado que não precisa buscar a última transação
   *
   * @param transactions Transações da posição
   * @returns Preço médio ponderado
   */
  calculateWeightedAveragePrice(transactions: Transaction[]): number {
    if (!transactions.length) return 0;

    return this.calculatePositionMetrics(transactions).averagePrice;
  }
}
