import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTablePortfolios1747792752543 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "portfolio",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "user_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "asset_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "platform_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "savings_goal_id",
                        type: "int",
                        isNullable: true,
                    },
                    {
                        name: "current_balance",
                        type: "decimal",
                        precision: 18,
                        scale: 8,
                        isNullable: false,
                        default: 0,
                    },
                    {
                        name: "average_price",
                        type: "decimal",
                        precision: 18,
                        scale: 8,
                        isNullable: false,
                        default: 0,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "deleted_at",
                        type: "timestamp",
                        isNullable: true,
                    },
                ],
            }),
            true
        );

        // Criando chave estrangeira para usuário
        await queryRunner.createForeignKey(
            "portfolio",
            new TableForeignKey({
                name: "FK_PORTFOLIO_USER",
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
                onDelete: "RESTRICT",
                onUpdate: "CASCADE",
            })
        );

        // Criando chave estrangeira para ativo
        await queryRunner.createForeignKey(
            "portfolio",
            new TableForeignKey({
                name: "FK_PORTFOLIO_ASSET",
                columnNames: ["asset_id"],
                referencedTableName: "asset",
                referencedColumnNames: ["id"],
                onDelete: "RESTRICT",
                onUpdate: "CASCADE",
            })
        );

        // Criando chave estrangeira para plataforma
        await queryRunner.createForeignKey(
            "portfolio",
            new TableForeignKey({
                name: "FK_PORTFOLIO_PLATFORM",
                columnNames: ["platform_id"],
                referencedTableName: "platform",
                referencedColumnNames: ["id"],
                onDelete: "RESTRICT",
                onUpdate: "CASCADE",
            })
        );

        // Criando chave estrangeira para caixinha/objetivo
        await queryRunner.createForeignKey(
            "portfolio",
            new TableForeignKey({
                name: "FK_PORTFOLIO_SAVINGS_GOAL",
                columnNames: ["savings_goal_id"],
                referencedTableName: "savings_goal",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL",
                onUpdate: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover as chaves estrangeiras primeiro
        await queryRunner.dropForeignKey("portfolio", "FK_PORTFOLIO_SAVINGS_GOAL");
        await queryRunner.dropForeignKey("portfolio", "FK_PORTFOLIO_PLATFORM");
        await queryRunner.dropForeignKey("portfolio", "FK_PORTFOLIO_ASSET");
        await queryRunner.dropForeignKey("portfolio", "FK_PORTFOLIO_USER");

        // Depois remover a tabela
        await queryRunner.dropTable("portfolio");
    }

}
