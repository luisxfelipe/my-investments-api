import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintToSavingsGoals1748346900000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`saving_goal\`
      ADD UNIQUE INDEX \`UQ_saving_goal_name_user\` (\`name\`, \`user_id\`);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`saving_goal\`
      DROP INDEX \`UQ_saving_goal_name_user\`;
    `);
  }
}
