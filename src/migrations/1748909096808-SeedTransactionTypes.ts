import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTransactionTypes1748909096808 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Inserir tipos de transação OBRIGATÓRIOS para funcionamento do sistema
    await queryRunner.query(`
      INSERT INTO transaction_type (id, type) VALUES
      (1, 'Entrada'),
      (2, 'Saída')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover os tipos de transação inseridos
    await queryRunner.query(`
      DELETE FROM transaction_type WHERE id IN (1, 2)
    `);
  }
}
