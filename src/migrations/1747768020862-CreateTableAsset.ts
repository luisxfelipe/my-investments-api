import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTableAsset1747768020862 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "asset",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "100",
                        isNullable: false,
                    },
                    {
                        name: "code",
                        type: "varchar",
                        length: "20",
                        isNullable: true,
                    },
                    {
                        name: "category_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "asset_type_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "platform_id",
                        type: "int",
                        isNullable: false,
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

        // Criando chave estrangeira para categoria
        await queryRunner.createForeignKey(
            "asset",
            new TableForeignKey({
                name: "FK_ASSET_CATEGORY",
                columnNames: ["category_id"],
                referencedTableName: "category",
                referencedColumnNames: ["id"],
                onDelete: "RESTRICT",
                onUpdate: "CASCADE",
            })
        );

        // Criando chave estrangeira para tipo de ativo
        await queryRunner.createForeignKey(
            "asset",
            new TableForeignKey({
                name: "FK_ASSET_ASSET_TYPE",
                columnNames: ["asset_type_id"],
                referencedTableName: "asset_type",
                referencedColumnNames: ["id"],
                onDelete: "RESTRICT",
                onUpdate: "CASCADE",
            })
        );

        // Criando chave estrangeira para plataforma
        await queryRunner.createForeignKey(
            "asset",
            new TableForeignKey({
                name: "FK_ASSET_PLATFORM",
                columnNames: ["platform_id"],
                referencedTableName: "platform",
                referencedColumnNames: ["id"],
                onDelete: "RESTRICT",
                onUpdate: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover as chaves estrangeiras primeiro
        await queryRunner.dropForeignKey("asset", "FK_ASSET_PLATFORM");
        await queryRunner.dropForeignKey("asset", "FK_ASSET_ASSET_TYPE");
        await queryRunner.dropForeignKey("asset", "FK_ASSET_CATEGORY");

        // Depois remover a tabela
        await queryRunner.dropTable("asset");
    }

}
