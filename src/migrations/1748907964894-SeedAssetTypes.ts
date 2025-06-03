import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAssetTypes1748907964894 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Inserir tipos de ativos padrão
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover os tipos de ativos inseridos
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
  }
}
