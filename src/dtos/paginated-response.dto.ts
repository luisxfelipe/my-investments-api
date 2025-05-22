import { ApiProperty } from "@nestjs/swagger";

export class PaginatedResponseDto<T> {
    @ApiProperty({ description: 'Paged data', type: 'array', isArray: true })
    data: T[];

    @ApiProperty({ description: 'Total items found', type: Number })
    total: number;

    constructor(data: T[], total: number) {
        this.data = data;
        this.total = total;
    }
}