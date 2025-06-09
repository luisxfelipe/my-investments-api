import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableUser1749413518325 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA USER
    await queryRunner.query(`
      CREATE TABLE user (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_user_email (email)
      )
    `);

    console.log('✅ Tabela user criada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA USER
    await queryRunner.query(`DROP TABLE user`);
    console.log('🔄 Tabela user removida');
  }
}
