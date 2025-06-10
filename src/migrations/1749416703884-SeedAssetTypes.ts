import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAssetTypes1749416703884 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // INSERIR TIPOS DE ATIVOS PADRÃO
    await queryRunner.query(`
      INSERT INTO asset_type (name) VALUES
      ('Moeda Fiduciária'),
      ('Criptomoeda'),
      ('Ação'),
      ('Fundo de Investimento'),
      ('Fundo Imobiliário'),
      ('Fiagro'),
      ('ETF'),
      ('CDB')
    `);

    console.log('✅ Tipos de ativos padrão inseridos');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TIPOS DE ATIVOS PADRÃO
    await queryRunner.query(`
      DELETE FROM asset_type WHERE name IN (
        'Moeda Fiduciária',
        'Criptomoeda',
        'Ação',
        'Fundo de Investimento',
        'Fundo Imobiliário',
        'Fiagro',
        'ETF',
        'CDB'
      )
    `);

    console.log('🔄 Tipos de ativos padrão removidos');
  }
}
