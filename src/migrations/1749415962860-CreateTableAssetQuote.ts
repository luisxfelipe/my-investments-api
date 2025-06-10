import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableAssetQuote1749415962860 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA ASSET_QUOTE
    await queryRunner.query(`
      CREATE TABLE asset_quote (
        id INT NOT NULL AUTO_INCREMENT,
        asset_id INT NOT NULL,
        price DECIMAL(18,6) NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_asset_quote_asset FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_asset_quote_asset_timestamp (asset_id, timestamp DESC),
        INDEX idx_asset_quote_timestamp (timestamp DESC),
        INDEX idx_asset_quote_deleted_at (deleted_at)
      )
    `);

    console.log('✅ Tabela asset_quote criada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA ASSET_QUOTE
    await queryRunner.query(`DROP TABLE asset_quote`);
    console.log('🔄 Tabela asset_quote removida');
  }
}
