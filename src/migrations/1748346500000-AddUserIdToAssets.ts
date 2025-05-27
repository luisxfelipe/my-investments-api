import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToAssets1748346500000 implements MigrationInterface {
  name = 'AddUserIdToAssets1748346500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna user_id à tabela asset
    await queryRunner.query(`
      ALTER TABLE \`asset\`
      ADD COLUMN \`user_id\` int NOT NULL DEFAULT 1
    `);

    // Adicionar foreign key constraint
    await queryRunner.query(`
      ALTER TABLE \`asset\`
      ADD CONSTRAINT \`FK_asset_user_id\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE
    `);

    // Adicionar constraint de unicidade para code por usuário
    await queryRunner.query(`
      ALTER TABLE \`asset\`
      ADD CONSTRAINT \`UQ_asset_user_code\`
      UNIQUE (\`user_id\`, \`code\`)
    `);

    // Adicionar constraint de unicidade para name por usuário
    await queryRunner.query(`
      ALTER TABLE \`asset\`
      ADD CONSTRAINT \`UQ_asset_user_name\`
      UNIQUE (\`user_id\`, \`name\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover constraints
    await queryRunner.query(
      `ALTER TABLE \`asset\` DROP CONSTRAINT \`UQ_asset_user_name\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`asset\` DROP CONSTRAINT \`UQ_asset_user_code\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`asset\` DROP CONSTRAINT \`FK_asset_user_id\``,
    );

    // Remover coluna user_id
    await queryRunner.query(`ALTER TABLE \`asset\` DROP COLUMN \`user_id\``);
  }
}
