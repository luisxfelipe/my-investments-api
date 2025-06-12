import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableTransaction1749416123913 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA TRANSACTION
    await queryRunner.query(`
      CREATE TABLE transaction (
        id INT NOT NULL AUTO_INCREMENT,
        portfolio_id INT NOT NULL,
        transaction_type_id INT NOT NULL,
        transaction_reason_id INT NOT NULL,
        quantity DECIMAL(18,8) NOT NULL,
        unit_price DECIMAL(18,8) NOT NULL,
        total_value DECIMAL(18,8) NOT NULL,
        transaction_date DATETIME NOT NULL,
        fee DECIMAL(18,8) NULL,
        fee_type VARCHAR(50) NULL,
        notes TEXT NULL,
        linked_transaction_id INT NULL,
        current_balance DECIMAL(18,8) NOT NULL DEFAULT 0,
        average_price DECIMAL(18,8) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_transaction_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_transaction_transaction_type FOREIGN KEY (transaction_type_id) REFERENCES transaction_type(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_transaction_transaction_reason FOREIGN KEY (transaction_reason_id) REFERENCES transaction_reason(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_transaction_linked_transaction FOREIGN KEY (linked_transaction_id) REFERENCES transaction(id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT chk_fee_consistency CHECK (
          (fee = 0 AND fee_type IS NULL) OR 
          (fee > 0 AND fee_type IS NOT NULL)
        ),
        INDEX idx_transaction_portfolio_date (portfolio_id, transaction_date),
        INDEX idx_transaction_portfolio_date_id (portfolio_id, transaction_date DESC, id DESC),
        INDEX idx_transaction_created_at (created_at DESC),
        INDEX idx_transaction_deleted_at (deleted_at)
      )
    `);

    console.log('✅ Tabela transaction criada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA TRANSACTION
    await queryRunner.query(`DROP TABLE transaction`);
    console.log('🔄 Tabela transaction removida');
  }
}
