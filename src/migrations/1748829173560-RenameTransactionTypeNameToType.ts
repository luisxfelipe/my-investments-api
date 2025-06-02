import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTransactionTypeNameToType1748829173560
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Renomear coluna name para type na tabela transaction_type
    await queryRunner.query(
      `ALTER TABLE transaction_type CHANGE COLUMN name type VARCHAR(100) NOT NULL`,
    );

    // Atualizar o nome do índice único
    await queryRunner.query(
      `ALTER TABLE transaction_type DROP INDEX UQ_transaction_type_name`,
    );

    await queryRunner.query(
      `ALTER TABLE transaction_type ADD CONSTRAINT UQ_transaction_type_type UNIQUE (type)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter: renomear coluna type para name
    await queryRunner.query(
      `ALTER TABLE transaction_type CHANGE COLUMN type name VARCHAR(100) NOT NULL`,
    );

    // Reverter o nome do índice único
    await queryRunner.query(
      `ALTER TABLE transaction_type DROP INDEX UQ_transaction_type_type`,
    );

    await queryRunner.query(
      `ALTER TABLE transaction_type ADD CONSTRAINT UQ_transaction_type_name UNIQUE (name)`,
    );
  }
}
