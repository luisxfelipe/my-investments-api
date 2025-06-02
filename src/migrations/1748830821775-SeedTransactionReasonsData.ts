import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTransactionReasonsData1748830821775
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Popular a tabela transaction_reason com apenas Compra e Venda
    await queryRunner.query(`
      INSERT INTO transaction_reason (id, reason, transaction_type_id, created_at, updated_at) VALUES
      (1, 'Compra', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (2, 'Venda', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover os dados inseridos
    await queryRunner.query(
      `DELETE FROM transaction_reason WHERE id IN (1, 2)`,
    );
  }
}
