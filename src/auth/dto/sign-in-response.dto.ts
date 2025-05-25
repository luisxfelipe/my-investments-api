import { UserResponseDto } from "src/users/dto/user-response.dto";

export class SignInResponseDto {
    access_token: string;
    user: UserResponseDto;

    constructor(accessToken: string, user: UserResponseDto) {
        this.access_token = accessToken;
        this.user = user;
    }
}