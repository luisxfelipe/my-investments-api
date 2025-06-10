import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTransactionTypes1749416773985 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // INSERIR TIPOS DE TRANSAÇÃO OBRIGATÓRIOS
    await queryRunner.query(`
      INSERT INTO transaction_type (id, type) VALUES
      (1, 'Entrada'),
      (2, 'Saída')
    `);

    console.log('✅ Tipos de transação obrigatórios inseridos');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TIPOS DE TRANSAÇÃO
    await queryRunner.query(`
      DELETE FROM transaction_type WHERE id IN (1, 2)
    `);

    console.log('🔄 Tipos de transação removidos');
  }
}
