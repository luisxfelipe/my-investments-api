import { ApiProperty } from "@nestjs/swagger";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'transaction_type' })
export class TransactionType {
    @ApiProperty({ description: 'Transaction Type ID' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ description: 'Transaction Type Name' })
    @Column({ name: 'name', nullable: false, length: 50 })
    name: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;

    constructor(partial: Partial<TransactionType>) {
        Object.assign(this, partial);
    }
}
