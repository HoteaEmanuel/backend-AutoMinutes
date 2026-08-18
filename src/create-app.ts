import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import rateLimitConfig from './config/rate-limit.config';

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  // FRONTEND_URL is the stable production domain, but Vercel also spins up a
  // fresh hashed preview URL (frontend-auto-minutes-<hash>-<team>.vercel.app)
  // for every deployment, so a single exact-match origin can't cover both.
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
  const previewUrlPattern = /^https:\/\/frontend-auto-minutes-[a-z0-9]+-[a-z0-9-]+\.vercel\.app$/;
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin === frontendUrl || previewUrlPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  });

  // Only trust X-Forwarded-For when actually deployed behind a real reverse
  // proxy/load balancer — otherwise a client could spoof req.ip and dodge
  // (or attribute to someone else) the rate limiter below.
  const { trustProxy } = app.get<ConfigType<typeof rateLimitConfig>>(rateLimitConfig.KEY);
  if (trustProxy) app.set('trust proxy', 1);

  return app;
}
