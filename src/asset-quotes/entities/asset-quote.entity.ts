import { ApiProperty } from "@nestjs/swagger";
import { Asset } from "src/assets/entities/asset.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity({ name: 'asset_quote' })
export class AssetQuote {
    @ApiProperty({ description: 'Quote ID' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ description: 'Asset ID' })
    @Column({ name: 'asset_id' })
    assetId: number;

    @ManyToOne(() => Asset)
    @JoinColumn({ name: 'asset_id' })
    asset: Asset;

    @ApiProperty({ description: 'Asset price' })
    @Column({ name: 'price', type: 'decimal', precision: 18, scale: 6 })
    price: string;

    @ApiProperty({ description: 'Quote timestamp' })
    @Column({ name: 'timestamp', type: 'timestamp' })
    timestamp: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;

    constructor(partial: Partial<AssetQuote>) {
        Object.assign(this, partial);
    }
}