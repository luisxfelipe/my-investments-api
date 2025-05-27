import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';
import { authorizationToLoginPayload } from './../utils/base-64.converter';

export const UserDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const { authorization } = request.headers;

    if (!authorization) {
      throw new BadRequestException('Authorization header not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const authValue = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (typeof authValue !== 'string') {
      throw new BadRequestException('Invalid authorization header format');
    }

    const loginPayloadDto = authorizationToLoginPayload(
      authValue.replace('Bearer ', ''),
    );

    return loginPayloadDto?.id;
  },
);
