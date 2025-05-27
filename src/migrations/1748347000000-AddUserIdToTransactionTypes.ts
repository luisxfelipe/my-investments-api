import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToTransactionTypes1748347000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna user_id
    await queryRunner.query(`
      ALTER TABLE \`transaction_type\`
      ADD COLUMN \`user_id\` int NOT NULL DEFAULT 1
    `);

    // Adicionar foreign key para a tabela user
    await queryRunner.query(`
      ALTER TABLE \`transaction_type\`
      ADD CONSTRAINT \`FK_transaction_type_user_id\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE
    `);

    // Adicionar constraint de unicidade para name + user_id
    await queryRunner.query(`
      ALTER TABLE \`transaction_type\`
      ADD UNIQUE INDEX \`UQ_transaction_type_name_user\` (\`name\`, \`user_id\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover constraint de unicidade
    await queryRunner.query(`
      ALTER TABLE \`transaction_type\`
      DROP INDEX \`UQ_transaction_type_name_user\`
    `);

    // Remover foreign key
    await queryRunner.query(`
      ALTER TABLE \`transaction_type\`
      DROP FOREIGN KEY \`FK_transaction_type_user_id\`
    `);

    // Remover coluna user_id
    await queryRunner.query(`
      ALTER TABLE \`transaction_type\`
      DROP COLUMN \`user_id\`
    `);
  }
}
