import { ApiProperty } from "@nestjs/swagger";
import { Platform } from "../entities/platform.entity";

export class PlatformResponseDto {
    @ApiProperty({ description: 'Platform ID' })
    id: number;

    @ApiProperty({ description: 'Platform Name' })
    name: string;

    constructor(platform: Platform) {
        this.id = platform.id;
        this.name = platform.name;
    }
}