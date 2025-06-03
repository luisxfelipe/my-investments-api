import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCategories1748907979752 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Inserir categorias padrão
    await queryRunner.query(`
      INSERT INTO category (name) VALUES
      ('Renda Fixa'),
      ('Renda Variável'),
      ('Criptomoedas')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover as categorias inseridas
    await queryRunner.query(`
      DELETE FROM category WHERE name IN (
        'Renda Fixa',
        'Renda Variável',
        'Criptomoedas'
      )
    `);
  }
}
