import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateTablePortfolio1748896629669 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'portfolio',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'asset_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'platform_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'saving_goal_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Criando chave estrangeira para usuário
    await queryRunner.createForeignKey(
      'portfolio',
      new TableForeignKey({
        name: 'FK_PORTFOLIO_USER',
        columnNames: ['user_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Criando chave estrangeira para ativo
    await queryRunner.createForeignKey(
      'portfolio',
      new TableForeignKey({
        name: 'FK_PORTFOLIO_ASSET',
        columnNames: ['asset_id'],
        referencedTableName: 'asset',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Criando chave estrangeira para plataforma
    await queryRunner.createForeignKey(
      'portfolio',
      new TableForeignKey({
        name: 'FK_PORTFOLIO_PLATFORM',
        columnNames: ['platform_id'],
        referencedTableName: 'platform',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Criando chave estrangeira para caixinha/objetivo
    await queryRunner.createForeignKey(
      'portfolio',
      new TableForeignKey({
        name: 'FK_PORTFOLIO_SAVING_GOAL',
        columnNames: ['saving_goal_id'],
        referencedTableName: 'saving_goal',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Criando constraint de unicidade para user_id, asset_id, platform_id, saving_goal_id
    await queryRunner.query(`
      ALTER TABLE \`portfolio\`
      ADD CONSTRAINT \`UQ_user_asset_platform_goal\`
      UNIQUE (\`user_id\`, \`asset_id\`, \`platform_id\`, \`saving_goal_id\`)
    `);

    // Criando índices para performance
    await queryRunner.createIndex(
      'portfolio',
      new TableIndex({
        name: 'IDX_portfolio_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'portfolio',
      new TableIndex({
        name: 'IDX_portfolio_asset_id',
        columnNames: ['asset_id'],
      }),
    );

    await queryRunner.createIndex(
      'portfolio',
      new TableIndex({
        name: 'IDX_portfolio_platform_id',
        columnNames: ['platform_id'],
      }),
    );

    await queryRunner.createIndex(
      'portfolio',
      new TableIndex({
        name: 'IDX_portfolio_saving_goal_id',
        columnNames: ['saving_goal_id'],
      }),
    );

    await queryRunner.createIndex(
      'portfolio',
      new TableIndex({
        name: 'IDX_portfolio_user_asset',
        columnNames: ['user_id', 'asset_id'],
      }),
    );

    await queryRunner.createIndex(
      'portfolio',
      new TableIndex({
        name: 'IDX_portfolio_user_platform',
        columnNames: ['user_id', 'platform_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices primeiro
    await queryRunner.dropIndex('portfolio', 'IDX_portfolio_user_platform');
    await queryRunner.dropIndex('portfolio', 'IDX_portfolio_user_asset');
    await queryRunner.dropIndex('portfolio', 'IDX_portfolio_saving_goal_id');
    await queryRunner.dropIndex('portfolio', 'IDX_portfolio_platform_id');
    await queryRunner.dropIndex('portfolio', 'IDX_portfolio_asset_id');
    await queryRunner.dropIndex('portfolio', 'IDX_portfolio_user_id');

    // Remover constraint de unicidade
    await queryRunner.query(`
      ALTER TABLE \`portfolio\`
      DROP CONSTRAINT \`UQ_user_asset_platform_goal\`
    `);

    // Remover as chaves estrangeiras primeiro
    await queryRunner.dropForeignKey('portfolio', 'FK_PORTFOLIO_SAVING_GOAL');
    await queryRunner.dropForeignKey('portfolio', 'FK_PORTFOLIO_PLATFORM');
    await queryRunner.dropForeignKey('portfolio', 'FK_PORTFOLIO_ASSET');
    await queryRunner.dropForeignKey('portfolio', 'FK_PORTFOLIO_USER');

    // Depois remover a tabela
    await queryRunner.dropTable('portfolio');
  }
}
