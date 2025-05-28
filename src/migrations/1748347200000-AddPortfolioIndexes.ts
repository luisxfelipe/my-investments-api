import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPortfolioIndexes1748347200000 implements MigrationInterface {
  name = 'AddPortfolioIndexes1748347200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Função auxiliar para criar índices somente se não existirem
    const createIndexIfNotExists = async (
      indexName: string,
      query: string,
    ): Promise<void> => {
      const indexExists = (await queryRunner.query(
        `SELECT COUNT(*) as count FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'portfolio' AND index_name = '${indexName}'`,
      )) as Array<{ count: number }>;

      if (indexExists[0]?.count === 0) {
        await queryRunner.query(query);
        console.log(`✅ Índice ${indexName} criado com sucesso`);
      } else {
        console.log(`⚠️ Índice ${indexName} já existe, pulando...`);
      }
    };

    // Índices individuais para consultas específicas
    await createIndexIfNotExists(
      'IDX_portfolio_user_id',
      `CREATE INDEX IDX_portfolio_user_id ON portfolio(user_id)`,
    );

    await createIndexIfNotExists(
      'IDX_portfolio_asset_id',
      `CREATE INDEX IDX_portfolio_asset_id ON portfolio(asset_id)`,
    );

    await createIndexIfNotExists(
      'IDX_portfolio_platform_id',
      `CREATE INDEX IDX_portfolio_platform_id ON portfolio(platform_id)`,
    );

    await createIndexIfNotExists(
      'IDX_portfolio_saving_goal_id',
      `CREATE INDEX IDX_portfolio_saving_goal_id ON portfolio(saving_goal_id)`,
    );

    // Índices compostos para consultas complexas
    await createIndexIfNotExists(
      'IDX_portfolio_user_asset',
      `CREATE INDEX IDX_portfolio_user_asset ON portfolio(user_id, asset_id)`,
    );

    await createIndexIfNotExists(
      'IDX_portfolio_user_platform',
      `CREATE INDEX IDX_portfolio_user_platform ON portfolio(user_id, platform_id)`,
    );

    // Índice para consultas de deleted_at (soft delete)
    await createIndexIfNotExists(
      'IDX_portfolio_deleted_at',
      `CREATE INDEX IDX_portfolio_deleted_at ON portfolio(deleted_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Função auxiliar para remover índices somente se existirem
    const dropIndexIfExists = async (
      indexName: string,
      query: string,
    ): Promise<void> => {
      const indexExists = (await queryRunner.query(
        `SELECT COUNT(*) as count FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'portfolio' AND index_name = '${indexName}'`,
      )) as Array<{ count: number }>;

      if (indexExists[0]?.count > 0) {
        await queryRunner.query(query);
        console.log(`✅ Índice ${indexName} removido com sucesso`);
      } else {
        console.log(`⚠️ Índice ${indexName} não existe, pulando...`);
      }
    };

    // Remover índices na ordem inversa
    await dropIndexIfExists(
      'IDX_portfolio_deleted_at',
      `DROP INDEX IDX_portfolio_deleted_at ON portfolio`,
    );

    await dropIndexIfExists(
      'IDX_portfolio_user_platform',
      `DROP INDEX IDX_portfolio_user_platform ON portfolio`,
    );

    await dropIndexIfExists(
      'IDX_portfolio_user_asset',
      `DROP INDEX IDX_portfolio_user_asset ON portfolio`,
    );

    await dropIndexIfExists(
      'IDX_portfolio_saving_goal_id',
      `DROP INDEX IDX_portfolio_saving_goal_id ON portfolio`,
    );

    await dropIndexIfExists(
      'IDX_portfolio_platform_id',
      `DROP INDEX IDX_portfolio_platform_id ON portfolio`,
    );

    await dropIndexIfExists(
      'IDX_portfolio_asset_id',
      `DROP INDEX IDX_portfolio_asset_id ON portfolio`,
    );

    await dropIndexIfExists(
      'IDX_portfolio_user_id',
      `DROP INDEX IDX_portfolio_user_id ON portfolio`,
    );
  }
}
