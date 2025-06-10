import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTransactionReasons1749416822339 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // INSERIR RAZÕES DE TRANSAÇÃO RECOMENDADAS
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

    console.log('✅ Razões de transação recomendadas inseridas');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER RAZÕES DE TRANSAÇÃO
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

    console.log('🔄 Razões de transação removidas');
  }
}
