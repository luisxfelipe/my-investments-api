import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTableAssetQuote1748000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "asset_quote",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "asset_id",
                        type: "int",
                        isNullable: false
                    },
                    {
                        name: "price",
                        type: "decimal",
                        precision: 18,
                        scale: 6,
                        isNullable: false
                    },
                    {
                        name: "timestamp",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "deleted_at",
                        type: "timestamp",
                        isNullable: true
                    }
                ]
            })
        );
        // Criando chave estrangeira para asset
        await queryRunner.createForeignKey(
            "asset_quote",
            new TableForeignKey({
                name: "FK_ASSET_QUOTE_ASSET",
                columnNames: ["asset_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "asset",
                onDelete: "CASCADE",
                onUpdate: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("asset_quote");
    }
}