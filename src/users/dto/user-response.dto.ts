import { ApiProperty } from "@nestjs/swagger";
import { User } from "../entities/user.entity";

export class UserResponseDto {
    @ApiProperty({ description: 'Unique User ID', example: 1 })
    id: number;

    @ApiProperty({ description: 'User"s full name', example: 'Felipe' })
    name: string;

    @ApiProperty({ description: 'User e-mail', example: 'felipe@email.com' })
    email: string;

    constructor(user: User) {
        this.id = user.id;
        this.name = user.name;
        this.email = user.email;
    }
}