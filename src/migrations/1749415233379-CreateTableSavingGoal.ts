import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableSavingGoal1749415233379 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA SAVING_GOAL
    await queryRunner.query(`
      CREATE TABLE saving_goal (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        target_value DECIMAL(15,2) NULL,
        target_date DATE NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_saving_goal_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE INDEX uq_saving_goal_name_user (name, user_id) USING BTREE,
        INDEX idx_saving_goal_user_name (user_id, name ASC),
        INDEX idx_saving_goal_deleted_at (deleted_at)
      )
    `);

    console.log('✅ Tabela saving_goal criada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA SAVING_GOAL
    await queryRunner.query(`DROP TABLE saving_goal`);
    console.log('🔄 Tabela saving_goal removida');
  }
}
