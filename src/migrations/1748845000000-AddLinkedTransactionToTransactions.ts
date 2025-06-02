import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddLinkedTransactionToTransactions1748845000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna linked_transaction_id
    await queryRunner.addColumn(
      'transaction',
      new TableColumn({
        name: 'linked_transaction_id',
        type: 'int',
        isNullable: true,
      }),
    );

    // Criar a chave estrangeira auto-referencial
    await queryRunner.createForeignKey(
      'transaction',
      new TableForeignKey({
        columnNames: ['linked_transaction_id'],
        referencedTableName: 'transaction',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_transaction_linked_transaction',
      }),
    );

    // Adicionar motivos específicos para transferências
    await queryRunner.query(`
      INSERT INTO transaction_reason (reason, transaction_type_id, created_at, updated_at)
      VALUES
      ('Transferência Enviada', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('Transferência Recebida', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover as razões de transação
    await queryRunner.query(`
      DELETE FROM transaction_reason
      WHERE reason IN ('Transferência Enviada', 'Transferência Recebida')
    `);

    // Remover a chave estrangeira
    await queryRunner.dropForeignKey(
      'transaction',
      'FK_transaction_linked_transaction',
    );

    // Remover a coluna
    await queryRunner.dropColumn('transaction', 'linked_transaction_id');
  }
}
