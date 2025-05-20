import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateTableAssetTypes1747756263163 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "asset_type",
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
                        length: "50",
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

        // Criando um índice único para o campo 'name' para garantir nomes únicos
        await queryRunner.createIndex(
            "asset_type",
            new TableIndex({
                name: "IDX_ASSET_TYPE_NAME",
                columnNames: ["name"],
                isUnique: true,
                where: "deleted_at IS NULL", // Garante unicidade apenas para registros não deletados
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover o índice primeiro
        await queryRunner.dropIndex("asset_type", "IDX_ASSET_TYPE_NAME");

        // Depois remover a tabela
        await queryRunner.dropTable("asset_type");
    }

}
