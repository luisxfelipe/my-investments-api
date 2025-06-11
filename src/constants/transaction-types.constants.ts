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
 * Baseadas nos IDs definidos na migração SeedTransactionReasonsData e AddCurrencyAssetType
 */
export const TRANSACTION_REASON_IDS = {
  COMPRA: 1,
  VENDA: 2,
  DEPOSITO: 3,
  SAQUE: 4,
  TRANSFERENCIA_ENVIADA: 5,
  TRANSFERENCIA_RECEBIDA: 6,
} as const;

export const TRANSACTION_REASON_NAMES = {
  COMPRA: 'Compra',
  VENDA: 'Venda',
  DEPOSITO: 'Depósito',
  SAQUE: 'Saque',
  TRANSFERENCIA_ENVIADA: 'Transferência Enviada',
  TRANSFERENCIA_RECEBIDA: 'Transferência Recebida',
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
  isDeposito: (transactionReasonId: number) =>
    transactionReasonId === TRANSACTION_REASON_IDS.DEPOSITO,
  isSaque: (transactionReasonId: number) =>
    transactionReasonId === TRANSACTION_REASON_IDS.SAQUE,
  isTransferenciaEnviada: (transactionReasonId: number) =>
    transactionReasonId === TRANSACTION_REASON_IDS.TRANSFERENCIA_ENVIADA,
  isTransferenciaRecebida: (transactionReasonId: number) =>
    transactionReasonId === TRANSACTION_REASON_IDS.TRANSFERENCIA_RECEBIDA,
  isAnyTransfer: (transactionReasonId: number) =>
    transactionReasonId === TRANSACTION_REASON_IDS.TRANSFERENCIA_ENVIADA ||
    transactionReasonId === TRANSACTION_REASON_IDS.TRANSFERENCIA_RECEBIDA,
  isExchange: (transactionReasonId: number) =>
    transactionReasonId === TRANSACTION_REASON_IDS.COMPRA ||
    transactionReasonId === TRANSACTION_REASON_IDS.VENDA,
  isAnyLinkedTransaction: (transactionReasonId: number) =>
    TransactionReasonHelper.isAnyTransfer(transactionReasonId) ||
    TransactionReasonHelper.isExchange(transactionReasonId),
} as const;

export type TransactionTypeId =
  (typeof TRANSACTION_TYPE_IDS)[keyof typeof TRANSACTION_TYPE_IDS];
