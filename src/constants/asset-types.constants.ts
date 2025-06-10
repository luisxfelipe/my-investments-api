/**
 * Constantes semânticas para tipos de ativos
 * Baseadas nos IDs definidos nas migrações
 */
export const ASSET_TYPE_IDS = {
  ACAO: 1,
  FUNDO: 2,
  RENDA_FIXA: 3,
  CRIPTOMOEDA: 4,
  MOEDA: 5,
} as const;

export const ASSET_TYPE_NAMES = {
  ACAO: 'Ação',
  FUNDO: 'Fundo',
  RENDA_FIXA: 'Renda Fixa',
  CRIPTOMOEDA: 'Criptomoeda',
  MOEDA: 'Moeda Fiduciária',
} as const;

/**
 * Helper functions para verificações semânticas
 */
export const AssetTypeHelper = {
  isAcao: (assetTypeId: number) => assetTypeId === ASSET_TYPE_IDS.ACAO,
  isFundo: (assetTypeId: number) => assetTypeId === ASSET_TYPE_IDS.FUNDO,
  isRendaFixa: (assetTypeId: number) =>
    assetTypeId === ASSET_TYPE_IDS.RENDA_FIXA,
  isCriptomoeda: (assetTypeId: number) =>
    assetTypeId === ASSET_TYPE_IDS.CRIPTOMOEDA,
  isMoeda: (assetTypeId: number) => assetTypeId === ASSET_TYPE_IDS.MOEDA,
} as const;

export type AssetTypeId = (typeof ASSET_TYPE_IDS)[keyof typeof ASSET_TYPE_IDS];
