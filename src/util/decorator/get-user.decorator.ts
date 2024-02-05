import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException('Token is not provided');
      }

      const token = authHeader.split(' ')[1];
      const decodedToken = jwt.decode(token);

      if (!decodedToken) {
        throw new UnauthorizedException('Token is not valid');
      }

      return decodedToken.sub;
      } catch (error) {
        console.error('GetUserId decorator error:', error);
        throw error;
      }
    }
);