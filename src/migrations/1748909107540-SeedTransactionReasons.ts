import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTransactionReasons1748909107540 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Inserir razões de transação RECOMENDADAS para funcionalidade completa
    await queryRunner.query(`
      INSERT INTO transaction_reason (reason, transaction_type_id) VALUES
      ('Compra', 1),
      ('Venda', 2),
      ('Transferência Enviada', 2),
      ('Transferência Recebida', 1),
      ('Depósito', 1),
      ('Saque', 2),
      ('Dividendo', 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover as razões de transação inseridas
    await queryRunner.query(`
      DELETE FROM transaction_reason WHERE reason IN (
        'Compra',
        'Venda',
        'Transferência Enviada',
        'Transferência Recebida',
        'Depósito',
        'Saque',
        'Dividendo'
      )
    `);
  }
}
