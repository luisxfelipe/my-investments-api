import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateTableAssetType1747756263163 implements MigrationInterface {
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
            name: 'user_id',
            type: 'int',
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

    // Criando chave estrangeira para usuário
    await queryRunner.createForeignKey(
      'asset_type',
      new TableForeignKey({
        name: 'FK_asset_type_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Criando um índice único para name por usuário para garantir nomes únicos por usuário
    await queryRunner.createIndex(
      'asset_type',
      new TableIndex({
        name: 'UQ_asset_type_name_user',
        columnNames: ['name', 'user_id'],
        isUnique: true,
        where: 'deleted_at IS NULL', // Garante unicidade apenas para registros não deletados
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover o índice primeiro
    await queryRunner.dropIndex('asset_type', 'UQ_asset_type_name_user');

    // Remover chave estrangeira
    await queryRunner.dropForeignKey('asset_type', 'FK_asset_type_user_id');

    // Depois remover a tabela
    await queryRunner.dropTable('asset_type');
  }
}
