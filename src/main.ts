import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { WebsocketAdapter } from './socket/adapter/websocket-adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.enableCors();
  // app.useWebSocketAdapter(new IoAdapter(app));
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get('FRONTEND_LOCAL_URL'),
  });

  app.useWebSocketAdapter(
    new WebsocketAdapter(app, {
      origin: configService.get('FRONTEND_LOCAL_URL'),
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('맛집 취향 분석 API Docs')
    .setDescription('천하무적팀 Swagger API 명세서')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'Token' }, 'access-token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(8080);
}
bootstrap();
