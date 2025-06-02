import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateTableCategory1747704073917 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'category',
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
      'category',
      new TableForeignKey({
        name: 'FK_category_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Criando um índice único para name por usuário para garantir nomes únicos por usuário
    await queryRunner.createIndex(
      'category',
      new TableIndex({
        name: 'UQ_category_name_user',
        columnNames: ['name', 'user_id'],
        isUnique: true,
        where: 'deleted_at IS NULL', // Garante unicidade apenas para registros não deletados
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover o índice primeiro
    await queryRunner.dropIndex('category', 'UQ_category_name_user');

    // Remover chave estrangeira
    await queryRunner.dropForeignKey('category', 'FK_category_user_id');

    // Depois remover a tabela
    await queryRunner.dropTable('category');
  }
}
