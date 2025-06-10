import { TransactionTypeHelper } from 'src/constants/transaction-types.constants';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { AssetTypeHelper } from './asset-types.constants';

/**
 * Utilitário para operações com moedas fiduciárias
 */
export class CurrencyHelper {
  /**
   * Verifica se o portfólio é de moeda fiduciária
   * @param assetTypeId ID do tipo do ativo do portfólio
   */
  static isCurrencyPortfolio(assetTypeId: number): boolean {
    return AssetTypeHelper.isMoeda(assetTypeId);
  }

  /**
   * Calcula saldo disponível em moeda fiduciária
   * @param transactions Transações do portfólio
   */
  static calculateAvailableBalance(transactions: Transaction[]): number {
    return transactions.reduce((balance, transaction) => {
      // Se for entrada (depósito, venda, transferência recebida), adiciona ao saldo
      if (TransactionTypeHelper.isEntrada(transaction.transactionTypeId)) {
        return balance + transaction.quantity;
      }
      // Se for saída (saque, compra, transferência enviada), subtrai do saldo
      else if (TransactionTypeHelper.isSaida(transaction.transactionTypeId)) {
        return balance - transaction.quantity;
      }
      return balance;
    }, 0);
  }

  /**
   * Retorna o preço unitário padrão para moedas (sempre 1)
   */
  static getDefaultUnitPrice(): number {
    return 1;
  }

  /**
   * Calcula o total investido em ativos não-monetários em uma plataforma
   * @param transactions Todas as transações da plataforma
   * @param currencyAssetTypeIds IDs dos tipos de ativo considerados como moeda
   */
  static calculateTotalInvested(
    transactions: Transaction[],
    currencyAssetTypeIds: number[] = [5], // Padrão: ID 5 = Moeda Fiduciária
  ): number {
    // Filtrar apenas transações de saída que sejam do tipo COMPRA
    const purchases = transactions.filter(
      (t) =>
        TransactionTypeHelper.isSaida(t.transactionTypeId) &&
        !currencyAssetTypeIds.includes(t.portfolio.asset.assetTypeId),
    );

    // Somar o valor total das compras
    return purchases.reduce((total, t) => {
      return total + t.quantity * t.unitPrice;
    }, 0);
  }
}
