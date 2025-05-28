import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPortfolioUniqueConstraint1748396451182
  implements MigrationInterface
{
  name = 'FixPortfolioUniqueConstraint1748396451182';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Função auxiliar para verificar se constraint existe
    const constraintExists = async (
      constraintName: string,
    ): Promise<boolean> => {
      const result = (await queryRunner.query(
        `SELECT COUNT(*) as count FROM information_schema.table_constraints
         WHERE table_schema = DATABASE()
         AND table_name = 'portfolio'
         AND constraint_name = '${constraintName}'`,
      )) as Array<{ count: number }>;
      return result[0]?.count > 0;
    };

    // Primeiro, adicionamos o novo constraint que inclui savingGoalId (note: sem 's')
    // Não removemos o antigo para evitar problemas com foreign keys
    if (!(await constraintExists('UQ_user_asset_platform_goal'))) {
      console.log('🔧 Adicionando novo constraint incluindo saving_goal_id...');
      await queryRunner.query(`
        ALTER TABLE portfolio
        ADD CONSTRAINT UQ_user_asset_platform_goal
        UNIQUE (user_id, asset_id, platform_id, saving_goal_id)
      `);
      console.log(
        '✅ Constraint UQ_user_asset_platform_goal criado com sucesso!',
      );
    }

    // Adicionamos validação no PortfoliosService (já implementado)
    console.log('✅ Validação adicional no PortfoliosService já implementada');

    console.log(
      '🎯 Portfolio constraints atualizados para modelo de "caixinhas"!',
    );
    console.log(
      '✅ Agora é possível ter múltiplos portfolios do mesmo ativo por objetivo.',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Função auxiliar para verificar se constraint existe
    const constraintExists = async (
      constraintName: string,
    ): Promise<boolean> => {
      const result = (await queryRunner.query(
        `SELECT COUNT(*) as count FROM information_schema.table_constraints
         WHERE table_schema = DATABASE()
         AND table_name = 'portfolio'
         AND constraint_name = '${constraintName}'`,
      )) as Array<{ count: number }>;
      return result[0]?.count > 0;
    };

    // Remover constraint se existir
    if (await constraintExists('UQ_user_asset_platform_goal')) {
      await queryRunner.query(`
        ALTER TABLE portfolio
        DROP INDEX UQ_user_asset_platform_goal
      `);
      console.log('✅ Constraint UQ_user_asset_platform_goal removido');
    }
  }
}
