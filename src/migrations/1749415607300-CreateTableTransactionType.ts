import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableTransactionType1749415607300
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA TRANSACTION_TYPE
    await queryRunner.query(`
      CREATE TABLE transaction_type (
        id INT NOT NULL AUTO_INCREMENT,
        type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX uq_transaction_type_type (type)
      )
    `);

    console.log('✅ Tabela transaction_type criada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA TRANSACTION_TYPE
    await queryRunner.query(`DROP TABLE transaction_type`);
    console.log('🔄 Tabela transaction_type removida');
  }
}
