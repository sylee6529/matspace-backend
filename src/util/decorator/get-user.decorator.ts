import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log(authHeader);

    if (!authHeader) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.decode(token);
    console.log(decodedToken);
    console.log(decodedToken.sub);

    if (!decodedToken) {
      return null;
    }

    return decodedToken.sub;
  }
);