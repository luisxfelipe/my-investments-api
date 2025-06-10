import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBasicAssets1749416934868 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // INSERIR ATIVOS BÁSICOS DE MOEDA (BRL e USD)

    // Buscar ID do tipo "Moeda Fiduciária"
    const assetTypeResult = (await queryRunner.query(`
      SELECT id FROM asset_type WHERE name = 'Moeda Fiduciária'
    `)) as Array<{ id: number }>;

    if (assetTypeResult && assetTypeResult.length > 0) {
      const currencyTypeId = assetTypeResult[0].id;

      // Buscar ID da categoria "Renda Fixa" como padrão para moedas
      const categoryResult = (await queryRunner.query(`
        SELECT id FROM category WHERE name = 'Renda Fixa'
      `)) as Array<{ id: number }>;

      if (categoryResult && categoryResult.length > 0) {
        const categoryId = categoryResult[0].id;

        await queryRunner.query(`
          INSERT INTO asset (name, code, asset_type_id, category_id, user_id) VALUES
          ('Real Brasileiro', 'BRL', ${currencyTypeId}, ${categoryId}, 1),
          ('Dólar Americano', 'USD', ${currencyTypeId}, ${categoryId}, 1)
        `);

        console.log('✅ Ativos básicos (BRL, USD) inseridos');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER ATIVOS BÁSICOS
    await queryRunner.query(`
      DELETE FROM asset WHERE code IN ('BRL', 'USD')
    `);

    console.log('🔄 Ativos básicos removidos');
  }
}
