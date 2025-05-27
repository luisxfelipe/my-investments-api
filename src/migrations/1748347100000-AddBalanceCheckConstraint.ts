import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBalanceCheckConstraint1748347100000
  implements MigrationInterface
{
  name = 'AddBalanceCheckConstraint1748347100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add CHECK constraint to ensure currentBalance is never negative
    await queryRunner.query(
      `ALTER TABLE portfolio ADD CONSTRAINT CHK_portfolio_current_balance_positive
       CHECK (current_balance >= 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the CHECK constraint
    await queryRunner.query(
      `ALTER TABLE portfolio DROP CONSTRAINT CHK_portfolio_current_balance_positive`,
    );
  }
}
