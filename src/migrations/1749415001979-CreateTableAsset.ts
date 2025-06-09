import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableAsset1749415001979 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA ASSET
    await queryRunner.query(`
      CREATE TABLE asset (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NULL,
        category_id INT NOT NULL,
        asset_type_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_asset_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_asset_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_asset_asset_type FOREIGN KEY (asset_type_id) REFERENCES asset_type(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT uq_asset_user_code UNIQUE (user_id, code),
        CONSTRAINT uq_asset_user_name UNIQUE (user_id, name),
        INDEX idx_asset_user_name (user_id, name ASC),
        INDEX idx_asset_category_id (category_id),
        INDEX idx_asset_asset_type_id (asset_type_id),
        INDEX idx_asset_deleted_at (deleted_at)
      )
    `);

    console.log('✅ Tabela asset criada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA ASSET
    await queryRunner.query(`DROP TABLE asset`);
    console.log('🔄 Tabela asset removida');
  }
}
