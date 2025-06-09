import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableAssetType1749414075645 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA ASSET_TYPE
    await queryRunner.query(`
      CREATE TABLE asset_type (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX uq_asset_type_name (name),
        INDEX idx_asset_type_name (name ASC),
        INDEX idx_asset_type_deleted_at (deleted_at)
      )
    `);

    console.log('✅ Tabela asset_type criada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA ASSET_TYPE
    await queryRunner.query(`DROP TABLE asset_type`);
    console.log('🔄 Tabela asset_type removida');
  }
}
