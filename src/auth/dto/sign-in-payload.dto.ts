import { User } from 'src/users/entities/user.entity';

export class SignInPayloadDto {
  id: number;
  name: string;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
  }
}
