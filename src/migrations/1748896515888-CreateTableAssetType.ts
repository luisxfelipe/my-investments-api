import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTableAssetType1748896515888 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'asset_type',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '50',
            isNullable: false,
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

    // Criando um índice único para name global
    await queryRunner.createIndex(
      'asset_type',
      new TableIndex({
        name: 'UQ_asset_type_name',
        columnNames: ['name'],
        isUnique: true,
        where: 'deleted_at IS NULL', // Garante unicidade apenas para registros não deletados
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover o índice primeiro
    await queryRunner.dropIndex('asset_type', 'UQ_asset_type_name');

    // Depois remover a tabela
    await queryRunner.dropTable('asset_type');
  }
}
