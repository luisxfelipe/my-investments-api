import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConfigureDatabaseCharset1749409419798
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar versão do MySQL
    const versionResult = (await queryRunner.query(
      'SELECT VERSION() as version',
    )) as Array<{ version: string }>;

    const mysqlVersion = versionResult[0]?.version || '';
    const isMysql8Plus =
      mysqlVersion.startsWith('8.') || parseFloat(mysqlVersion) >= 8.0;

    // Definir collation baseada na versão
    const targetCharset = 'utf8mb4';
    const targetCollation = isMysql8Plus
      ? 'utf8mb4_0900_ai_ci'
      : 'utf8mb4_unicode_ci';

    // Verificar configuração atual do banco
    const currentConfigResult = (await queryRunner.query(`
      SELECT 
        DEFAULT_CHARACTER_SET_NAME as current_charset,
        DEFAULT_COLLATION_NAME as current_collation
      FROM information_schema.SCHEMATA 
      WHERE SCHEMA_NAME = DATABASE()
    `)) as Array<{
      current_charset: string;
      current_collation: string;
    }>;

    const currentCharset = currentConfigResult[0]?.current_charset;
    const currentCollation = currentConfigResult[0]?.current_collation;

    // Verificar se precisa alterar
    const needsChange =
      currentCharset !== targetCharset || currentCollation !== targetCollation;

    if (!needsChange) {
      return;
    }

    // Alterar configuração do banco
    const databaseName = await this.getCurrentDatabase(queryRunner);

    await queryRunner.query(`
      ALTER DATABASE \`${databaseName}\` 
      CHARACTER SET = ${targetCharset} 
      COLLATE = ${targetCollation}
    `);
  }

  public async down(): Promise<void> {
    // Rollback de configuração de charset não é recomendado
    // Se necessário, altere manualmente no MySQL
  }

  private async getCurrentDatabase(queryRunner: QueryRunner): Promise<string> {
    const result = (await queryRunner.query(
      'SELECT DATABASE() as db_name',
    )) as Array<{ db_name: string }>;

    return result[0]?.db_name || 'unknown';
  }
}
