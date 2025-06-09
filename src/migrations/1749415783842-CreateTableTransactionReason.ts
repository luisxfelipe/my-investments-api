import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableTransactionReason1749415783842
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA TRANSACTION_REASON
    await queryRunner.query(`
      CREATE TABLE transaction_reason (
        id INT NOT NULL AUTO_INCREMENT,
        reason VARCHAR(100) NOT NULL,
        transaction_type_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_transaction_reason_transaction_type FOREIGN KEY (transaction_type_id) REFERENCES transaction_type(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT uq_transaction_reason_reason UNIQUE (reason),
        INDEX idx_transaction_reason_type_id (transaction_type_id)
      )
    `);

    console.log('✅ Tabela transaction_reason criada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA TRANSACTION_REASON
    await queryRunner.query(`DROP TABLE transaction_reason`);
    console.log('🔄 Tabela transaction_reason removida');
  }
}
