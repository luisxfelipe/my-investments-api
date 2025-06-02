import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTransactionTypes1748829936931 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Limpar dados existentes (caso existam)
    await queryRunner.query(`DELETE FROM transaction_type`);

    // Inserir os tipos de transação
    await queryRunner.query(`
      INSERT INTO transaction_type (id, type, created_at, updated_at) VALUES 
      (1, 'Entrada', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (2, 'Saída', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover os dados inseridos
    await queryRunner.query(`DELETE FROM transaction_type WHERE id IN (1, 2)`);
  }
}
