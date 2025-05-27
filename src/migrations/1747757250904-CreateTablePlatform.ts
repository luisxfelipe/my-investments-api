import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTablePlatform1747757250904 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'platform',
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

    // Criando um índice único para o campo 'name' para garantir nomes únicos
    await queryRunner.createIndex(
      'platform',
      new TableIndex({
        name: 'IDX_PLATFORM_NAME',
        columnNames: ['name'],
        isUnique: true,
        where: 'deleted_at IS NULL', // Garante unicidade apenas para registros não deletados
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover o índice primeiro
    await queryRunner.dropIndex('platform', 'IDX_PLATFORM_NAME');

    // Depois remover a tabela
    await queryRunner.dropTable('platform');
  }
}
