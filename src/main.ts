import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '@app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import rateLimitConfig from '@config/rate-limit.config';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });

  // Only trust X-Forwarded-For when actually deployed behind a real reverse
  // proxy/load balancer — otherwise a client could spoof req.ip and dodge
  // (or attribute to someone else) the rate limiter below.
  const { trustProxy } = app.get<ConfigType<typeof rateLimitConfig>>(rateLimitConfig.KEY);
  if (trustProxy) app.set('trust proxy', 1);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
