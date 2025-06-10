import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCategories1749416615882 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // INSERIR CATEGORIAS PADRÃO
    await queryRunner.query(`
      INSERT INTO category (name) VALUES
      ('Renda Fixa'),
      ('Renda Variável'),
      ('Criptomoedas')
    `);

    console.log('✅ Categorias padrão inseridas');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER CATEGORIAS PADRÃO
    await queryRunner.query(`
      DELETE FROM category WHERE name IN (
        'Renda Fixa',
        'Renda Variável',
        'Criptomoedas'
      )
    `);

    console.log('🔄 Categorias padrão removidas');
  }
}
