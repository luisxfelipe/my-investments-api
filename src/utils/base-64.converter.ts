import { SignInPayloadDto } from '../auth/dto/sign-in-payload.dto';

export const authorizationToLoginPayload = (
  authorization: string,
): SignInPayloadDto | undefined => {
  const authorizationSplitted = authorization.split('.');

  if (authorizationSplitted.length < 3 || !authorizationSplitted[1]) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(authorizationSplitted[1], 'base64').toString('ascii'),
    ) as SignInPayloadDto;

    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }

    return undefined;
  } catch {
    return undefined;
  }
};
