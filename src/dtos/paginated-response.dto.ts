import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "./pagination.dto";

export class PaginatedResponseDto<T> {
    @ApiProperty({ 
        description: 'Metadata da paginação',
        type: PaginationMetaDto
    })
    meta: PaginationMetaDto;

    @ApiProperty({ 
        description: 'Dados paginados', 
        type: 'array', 
        isArray: true 
    })
    data: T[];

    constructor(data: T[], total: number, itemsPerPage: number, currentPage: number) {
        const totalPages = Math.ceil(total / itemsPerPage);
        
        this.meta = new PaginationMetaDto(
            itemsPerPage,
            total,
            currentPage,
            totalPages
        );
        
        this.data = data;
    }
}