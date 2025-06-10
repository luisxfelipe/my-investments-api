import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedFirstUser1749416461908 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // CRIAR PRIMEIRO USUÁRIO COM SENHA HASH
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('123456', salt);

    await queryRunner.query(
      `INSERT INTO user (name, email, password, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      ['felipe', 'felipe@email.com', hashedPassword],
    );

    console.log('✅ Primeiro usuário criado');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // REMOVER PRIMEIRO USUÁRIO
    await queryRunner.query(`DELETE FROM user WHERE email = ?`, [
      'felipe@email.com',
    ]);
    console.log('🔄 Primeiro usuário removido');
  }
}
