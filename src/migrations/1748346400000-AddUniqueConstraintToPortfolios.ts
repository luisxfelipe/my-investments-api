import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintToPortfolios1748346400000
  implements MigrationInterface
{
  name = 'AddUniqueConstraintToPortfolios1748346400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`portfolio\`
      ADD CONSTRAINT \`UQ_user_asset_platform\`
      UNIQUE (\`user_id\`, \`asset_id\`, \`platform_id\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`portfolio\`
      DROP CONSTRAINT \`UQ_user_asset_platform\`
    `);
  }
}
