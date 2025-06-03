import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBasicAssets1748909412570 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Inserir ativos básicos de moeda (BRL e USD)
    // Primeiro busca o ID do tipo "Moeda Fiduciária"
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
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover os ativos básicos inseridos
    await queryRunner.query(`
      DELETE FROM asset WHERE code IN ('BRL', 'USD')
    `);
  }
}
