import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class CreateFirstUser1748898155575 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hash the password using the same method as UsersService
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('123456', salt);

    // Insert the first user
    await queryRunner.query(
      `
      INSERT INTO USER (name, email, password, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `,
      ['felipe', 'felipe@email.com', hashedPassword],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the first user
    await queryRunner.query(
      `
      DELETE FROM USER WHERE email = ?
    `,
      ['felipe@email.com'],
    );
  }
}
