import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class RemoveUserIdFromTransactionTypes1748827996229
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remover índice único que inclui user_id
    await queryRunner.query(
      `DROP INDEX UQ_transaction_type_name_user ON transaction_type`,
    );

    // Remover foreign key de user_id
    await queryRunner.query(
      `ALTER TABLE transaction_type DROP FOREIGN KEY FK_transaction_type_user_id`,
    );

    // Remover coluna user_id
    await queryRunner.dropColumn('transaction_type', 'user_id');

    // Adicionar novo índice único apenas para name (global)
    await queryRunner.query(
      `ALTER TABLE transaction_type ADD CONSTRAINT UQ_transaction_type_name UNIQUE (name)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índice único global
    await queryRunner.query(
      `ALTER TABLE transaction_type DROP INDEX UQ_transaction_type_name`,
    );

    // Adicionar coluna user_id de volta
    await queryRunner.addColumn(
      'transaction_type',
      new TableColumn({
        name: 'user_id',
        type: 'int',
        isNullable: false,
      }),
    );

    // Recriar foreign key
    await queryRunner.createForeignKey(
      'transaction_type',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_transaction_type_user_id',
      }),
    );

    // Recriar índice único com user_id
    await queryRunner.query(
      `ALTER TABLE transaction_type ADD CONSTRAINT UQ_transaction_type_name_user UNIQUE (name, user_id)`,
    );
  }
}
