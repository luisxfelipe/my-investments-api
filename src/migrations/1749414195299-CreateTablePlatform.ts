import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTablePlatform1749414195299 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA PLATFORM
    await queryRunner.query(`
      CREATE TABLE platform (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_platform_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE INDEX uq_platform_name_user (name, user_id) USING BTREE COMMENT 'Unique name per user (excluding deleted)',
        INDEX idx_platform_user_name (user_id, name ASC),
        INDEX idx_platform_deleted_at (deleted_at)
      )
    `);

    console.log('✅ Tabela platform criada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA PLATFORM
    await queryRunner.query(`DROP TABLE platform`);
    console.log('🔄 Tabela platform removida');
  }
}
