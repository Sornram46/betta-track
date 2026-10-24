import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.API_ACCESS_TOKEN;
    if (!expected) {
      throw new ServiceUnavailableException(
        'Set API_ACCESS_TOKEN in api/.env before using protected endpoints.',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization ?? '';
    const supplied = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';
    const expectedBytes = Buffer.from(expected);
    const suppliedBytes = Buffer.from(supplied);

    if (
      suppliedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(suppliedBytes, expectedBytes)
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}