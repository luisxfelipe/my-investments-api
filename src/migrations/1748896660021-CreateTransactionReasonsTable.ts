import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTransactionReasonsTable1748896660021
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela transaction_reasons
    await queryRunner.createTable(
      new Table({
        name: 'transaction_reason',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'transaction_type_id',
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
        ],
      }),
    );

    // Criar foreign key
    await queryRunner.createForeignKey(
      'transaction_reason',
      new TableForeignKey({
        columnNames: ['transaction_type_id'],
        referencedTableName: 'transaction_type',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_transaction_reason_transaction_type_id',
      }),
    );

    // Adicionar índice único para reason (globalmente único)
    await queryRunner.query(
      `ALTER TABLE transaction_reason ADD CONSTRAINT UQ_transaction_reason_reason UNIQUE (reason)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transaction_reason');
  }
}
