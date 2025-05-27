import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToAssetTypes1748346700000 implements MigrationInterface {
  name = 'AddUserIdToAssetTypes1748346700000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna user_id já existe
    const table = await queryRunner.getTable('asset_type');
    const userIdColumn = table?.findColumnByName('user_id');

    if (!userIdColumn) {
      // Adicionar coluna user_id à tabela asset_type apenas se não existir
      await queryRunner.query(`
        ALTER TABLE \`asset_type\`
        ADD COLUMN \`user_id\` int NOT NULL DEFAULT 1
      `);

      // Adicionar foreign key constraint
      await queryRunner.query(`
        ALTER TABLE \`asset_type\`
        ADD CONSTRAINT \`FK_asset_type_user_id\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE
      `);
    }

    // Remover constraint de unicidade atual (se existir)
    try {
      await queryRunner.query(`
        ALTER TABLE \`asset_type\`
        DROP INDEX \`IDX_asset_type_name\`
      `);
    } catch {
      // Ignorar se o índice não existir
      console.log(
        'Index IDX_asset_type_name does not exist or could not be dropped',
      );
    }

    // Tentar adicionar constraint de unicidade para name por usuário
    try {
      await queryRunner.query(`
        ALTER TABLE \`asset_type\`
        ADD CONSTRAINT \`UQ_asset_type_name_user\`
        UNIQUE (\`name\`, \`user_id\`)
      `);
    } catch {
      // Ignorar se a constraint já existir
      console.log(
        'Constraint UQ_asset_type_name_user already exists or could not be created',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover constraint de unicidade por usuário
    await queryRunner.query(`
      ALTER TABLE \`asset_type\`
      DROP CONSTRAINT \`UQ_asset_type_name_user\`
    `);

    // Remover foreign key constraint
    await queryRunner.query(`
      ALTER TABLE \`asset_type\`
      DROP CONSTRAINT \`FK_asset_type_user_id\`
    `);

    // Remover coluna user_id
    await queryRunner.query(`
      ALTER TABLE \`asset_type\`
      DROP COLUMN \`user_id\`
    `);

    // Recriar constraint de unicidade global para name (se era necessário)
    await queryRunner.query(`
      ALTER TABLE \`asset_type\`
      ADD CONSTRAINT \`UQ_asset_type_name\`
      UNIQUE (\`name\`)
    `);
  }
}
