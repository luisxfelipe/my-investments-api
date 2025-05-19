import { UserResponseDto } from "src/users/dto/user-response.dto";

export class SignInResponseDto {
    accessToken: string;
    user: UserResponseDto;

    constructor(accessToken: string, user: UserResponseDto) {
        this.accessToken = accessToken;
        this.user = user;
    }
}