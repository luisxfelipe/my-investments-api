import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTableTransactionType1748896561351
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transaction_type',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '100',
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

    // Criando um índice único para o campo 'type' para garantir tipos únicos
    await queryRunner.createIndex(
      'transaction_type',
      new TableIndex({
        name: 'UQ_transaction_type_type',
        columnNames: ['type'],
        isUnique: true,
        where: 'deleted_at IS NULL', // Garante unicidade apenas para registros não deletados
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover o índice primeiro
    await queryRunner.dropIndex('transaction_type', 'UQ_transaction_type_type');

    // Depois remover a tabela
    await queryRunner.dropTable('transaction_type');
  }
}
