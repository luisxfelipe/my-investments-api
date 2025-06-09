import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTablePortfolio1749415370426 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR TABELA PORTFOLIO
    await queryRunner.query(`
      CREATE TABLE portfolio (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        asset_id INT NOT NULL,
        platform_id INT NOT NULL,
        saving_goal_id INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_portfolio_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_portfolio_asset FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_portfolio_platform FOREIGN KEY (platform_id) REFERENCES platform(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_portfolio_saving_goal FOREIGN KEY (saving_goal_id) REFERENCES saving_goal(id) ON DELETE SET NULL ON UPDATE CASCADE,
        UNIQUE INDEX uq_user_asset_platform_goal (user_id, asset_id, platform_id, saving_goal_id),
        INDEX idx_portfolio_user_id (user_id),
        INDEX idx_portfolio_asset_id (asset_id),
        INDEX idx_portfolio_platform_id (platform_id),
        INDEX idx_portfolio_saving_goal_id (saving_goal_id),
        INDEX idx_portfolio_user_asset (user_id, asset_id),
        INDEX idx_portfolio_user_platform (user_id, platform_id),
        INDEX idx_portfolio_created_at (created_at DESC),
        INDEX idx_portfolio_deleted_at (deleted_at)
      )
    `);

    console.log('✅ Tabela portfolio criada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER TABELA PORTFOLIO
    await queryRunner.query(`DROP TABLE portfolio`);
    console.log('🔄 Tabela portfolio removida');
  }
}
