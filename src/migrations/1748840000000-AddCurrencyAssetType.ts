import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyAssetType1748840000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar tipo de ativo para moedas fiduciárias
    await queryRunner.query(`
      INSERT INTO asset_type (id, name, created_at, updated_at)
      VALUES (5, 'Moeda Fiduciária', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    // 2. Adicionar moedas básicas como ativos
    await queryRunner.query(`
      INSERT INTO asset (name, code, category_id, asset_type_id, created_at, updated_at)
      VALUES
      ('Real Brasileiro', 'BRL', 1, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('Dólar Americano', 'USD', 1, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    // 3. Adicionar razões específicas para transações de moeda
    await queryRunner.query(`
      INSERT INTO transaction_reason (reason, transaction_type_id, created_at, updated_at)
      VALUES
      ('Depósito', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('Saque', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover as razões de transação
    await queryRunner.query(`
      DELETE FROM transaction_reason
      WHERE reason IN ('Depósito', 'Saque')
    `);

    // Remover os ativos de moedas
    await queryRunner.query(`
      DELETE FROM asset
      WHERE code IN ('BRL', 'USD') AND asset_type_id = 5
    `);

    // Remover o tipo de ativo de moeda
    await queryRunner.query(`
      DELETE FROM asset_type
      WHERE id = 5
    `);
  }
}
