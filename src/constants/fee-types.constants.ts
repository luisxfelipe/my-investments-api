export enum FeeType {
  PERCENTAGE_TARGET = 'percentage_target', // 0.1% sobre valor comprado (Binance)
  PERCENTAGE_SOURCE = 'percentage_source', // 0.1% sobre valor vendido
  FIXED_SOURCE = 'fixed_source', // R$ 20 fixo em BRL (Clear)
  FIXED_TARGET = 'fixed_target', // $5 fixo em USD
}

export const FEE_TYPE_DESCRIPTIONS = {
  [FeeType.PERCENTAGE_TARGET]:
    'Percentage fee applied to target amount (e.g., 0.1% on purchased asset)',
  [FeeType.PERCENTAGE_SOURCE]:
    'Percentage fee applied to source amount (e.g., 0.1% on sold asset)',
  [FeeType.FIXED_SOURCE]:
    'Fixed fee charged in source currency (e.g., R$ 20 in BRL)',
  [FeeType.FIXED_TARGET]:
    'Fixed fee charged in target currency (e.g., $5 in USD)',
} as const;
