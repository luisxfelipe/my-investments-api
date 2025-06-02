import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddTransactionReasonToTransactions1748829600244
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna transaction_reason_id após transaction_type_id
    await queryRunner.query(`
      ALTER TABLE transaction 
      ADD COLUMN transaction_reason_id INT NOT NULL 
      AFTER transaction_type_id
    `);

    // Criar foreign key
    await queryRunner.createForeignKey(
      'transaction',
      new TableForeignKey({
        columnNames: ['transaction_reason_id'],
        referencedTableName: 'transaction_reason',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'FK_transaction_transaction_reason_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign key
    const table = await queryRunner.getTable('transaction');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('transaction_reason_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('transaction', foreignKey);
      }
    }

    // Remover coluna
    await queryRunner.dropColumn('transaction', 'transaction_reason_id');
  }
}
