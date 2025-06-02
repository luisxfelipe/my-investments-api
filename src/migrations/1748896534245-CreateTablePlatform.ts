import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateTablePlatform1748896534245 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a tabela já existe
    const tableExists = await queryRunner.hasTable('platform');

    if (!tableExists) {
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
        'platform',
        new TableForeignKey({
          name: 'FK_PLATFORM_USER',
          columnNames: ['user_id'],
          referencedTableName: 'user',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Verificar se o índice já existe antes de criar
    const table = await queryRunner.getTable('platform');
    const indexExists = table?.indices.some(
      (index) => index.name === 'UQ_platform_name_user',
    );

    if (!indexExists) {
      // Criando um índice único para name por usuário para garantir nomes únicos por usuário
      await queryRunner.createIndex(
        'platform',
        new TableIndex({
          name: 'UQ_platform_name_user',
          columnNames: ['name', 'user_id'],
          isUnique: true,
          where: 'deleted_at IS NULL', // Garante unicidade apenas para registros não deletados
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('platform');

    if (tableExists) {
      // Verificar se o índice existe antes de remover
      const table = await queryRunner.getTable('platform');
      const indexExists = table?.indices.some(
        (index) => index.name === 'UQ_platform_name_user',
      );

      if (indexExists) {
        await queryRunner.dropIndex('platform', 'UQ_platform_name_user');
      }

      // Verificar se a foreign key existe antes de remover
      const foreignKeyExists = table?.foreignKeys.some(
        (fk) => fk.name === 'FK_PLATFORM_USER',
      );

      if (foreignKeyExists) {
        await queryRunner.dropForeignKey('platform', 'FK_PLATFORM_USER');
      }

      // Remover a tabela
      await queryRunner.dropTable('platform');
    }
  }
}
