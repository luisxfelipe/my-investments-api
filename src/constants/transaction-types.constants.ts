/**
 * Constantes semânticas para tipos de transação
 * Baseadas nos IDs definidos na migração SeedTransactionTypes
 */
export const TRANSACTION_TYPE_IDS = {
  ENTRADA: 1,
  SAIDA: 2,
} as const;

export const TRANSACTION_TYPE_NAMES = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
} as const;

/**
 * Constantes semânticas para razões de transação
 * Baseadas nos IDs definidos na migração SeedTransactionReasonsData
 */
export const TRANSACTION_REASON_IDS = {
  COMPRA: 1,
  VENDA: 2,
} as const;

export const TRANSACTION_REASON_NAMES = {
  COMPRA: 'Compra',
  VENDA: 'Venda',
} as const;

/**
 * Helper functions para verificações semânticas
 */
export const TransactionTypeHelper = {
  isEntrada: (transactionTypeId: number) =>
    transactionTypeId === TRANSACTION_TYPE_IDS.ENTRADA,
  isSaida: (transactionTypeId: number) =>
    transactionTypeId === TRANSACTION_TYPE_IDS.SAIDA,
} as const;

export const TransactionReasonHelper = {
  isCompra: (transactionReasonId: number) =>
    transactionReasonId === TRANSACTION_REASON_IDS.COMPRA,
  isVenda: (transactionReasonId: number) =>
    transactionReasonId === TRANSACTION_REASON_IDS.VENDA,
} as const;

export type TransactionTypeId =
  (typeof TRANSACTION_TYPE_IDS)[keyof typeof TRANSACTION_TYPE_IDS];
