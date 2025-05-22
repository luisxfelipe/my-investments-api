import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'saving_goal' })
export class SavingGoal {
    @ApiProperty({ description: 'Savings Goal ID' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ description: 'User ID' })
    @Column({ name: 'user_id' })
    userId: number;

    @ApiProperty({ description: 'Savings Goal Name' })
    @Column({ name: 'name', nullable: false, length: 100 })
    name: string;

    @ApiProperty({ description: 'Savings Goal Description', required: false })
    @Column({ name: 'description', nullable: true, type: 'text' })
    description: string;

    @ApiProperty({ description: 'Target Value', required: false })
    @Column({ name: 'target_value', nullable: true, type: 'decimal', precision: 15, scale: 2 })
    targetValue: number;

    @ApiProperty({ description: 'Target Date', required: false })
    @Column({ name: 'target_date', nullable: true, type: 'date' })
    targetDate: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;

    constructor(partial: Partial<SavingGoal>) {
        Object.assign(this, partial);
    }
}
