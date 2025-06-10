import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableCategory1749413897324 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA CATEGORY
    await queryRunner.query(`
      CREATE TABLE category (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX uq_category_name (name),
        INDEX idx_category_name (name ASC),
        INDEX idx_category_deleted_at (deleted_at)
      )
    `);

    console.log('✅ Tabela category criada');
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA CATEGORY
    await queryRunner.query(`DROP TABLE category`);
    console.log('🔄 Tabela category removida');
  }
}
