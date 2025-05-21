import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTableTransactions1747794194905 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "transaction",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "portfolio_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "transaction_type_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "quantity",
                        type: "decimal",
                        precision: 18,
                        scale: 8,
                        isNullable: false,
                    },
                    {
                        name: "unit_price",
                        type: "decimal",
                        precision: 18,
                        scale: 8,
                        isNullable: false,
                    },
                    {
                        name: "total_value",
                        type: "decimal",
                        precision: 18,
                        scale: 8,
                        isNullable: false,
                    },
                    {
                        name: "transaction_date",
                        type: "datetime",
                        isNullable: false,
                    },
                    {
                        name: "fee",
                        type: "decimal",
                        precision: 18,
                        scale: 8,
                        isNullable: true,
                    },
                    {
                        name: "notes",
                        type: "text",
                        isNullable: true,
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

        // Criando chave estrangeira para portfolio
        await queryRunner.createForeignKey(
            "transaction",
            new TableForeignKey({
                name: "FK_TRANSACTION_PORTFOLIO",
                columnNames: ["portfolio_id"],
                referencedTableName: "portfolio",
                referencedColumnNames: ["id"],
                onDelete: "RESTRICT",
                onUpdate: "CASCADE",
            })
        );

        // Criando chave estrangeira para tipo de transação
        await queryRunner.createForeignKey(
            "transaction",
            new TableForeignKey({
                name: "FK_TRANSACTION_TRANSACTION_TYPE",
                columnNames: ["transaction_type_id"],
                referencedTableName: "transaction_type",
                referencedColumnNames: ["id"],
                onDelete: "RESTRICT",
                onUpdate: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover as chaves estrangeiras primeiro
        await queryRunner.dropForeignKey("transaction", "FK_TRANSACTION_TRANSACTION_TYPE");
        await queryRunner.dropForeignKey("transaction", "FK_TRANSACTION_PORTFOLIO");

        // Depois remover a tabela
        await queryRunner.dropTable("transaction");
    }

}
