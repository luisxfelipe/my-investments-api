import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { SignInDto } from './dto/sign-in.dto';
import { User } from 'src/users/entities/user.entity';
import { comparePassword } from 'src/utils/password';
import { SignInPayloadDto } from './dto/sign-in-payload.dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDto) {
    const user: User | undefined = await this.userService
      .findOneByEmail(signInDto.email)
      .catch(() => undefined);

    if (
      !user ||
      !(await comparePassword(signInDto.password, user.password || ''))
    ) {
      throw new UnauthorizedException('Email or password invalid!');
    }

    return {
      access_token: await this.jwtService.sign({
        ...new SignInPayloadDto(user),
      }),
      user: new UserResponseDto(user),
    };
  }
}
