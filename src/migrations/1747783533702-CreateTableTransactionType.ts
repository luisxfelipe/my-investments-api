import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateTableTransactionType1747783533702 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "transaction_type",
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
            "transaction_type",
            new TableIndex({
                name: "IDX_TRANSACTION_TYPE_NAME",
                columnNames: ["name"],
                isUnique: true,
                where: "deleted_at IS NULL", // Garante unicidade apenas para registros não deletados
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover o índice primeiro
        await queryRunner.dropIndex("transaction_type", "IDX_TRANSACTION_TYPE_NAME");

        // Depois remover a tabela
        await queryRunner.dropTable("transaction_type");
    }

}
