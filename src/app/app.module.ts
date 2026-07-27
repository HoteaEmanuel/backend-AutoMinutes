import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '@users/users.module';
import { DatabaseModule } from '@database/database.module';
import jwtConfig from '@config/jwt.config';
import dbConfig from '@config/db.config';
import aiConfig from '@config/ai.config';
import r2Config from '@config/r2.config';
import mailConfig from '@config/mail.config';
import { AuthModule } from 'src/auth/auth.module';
import { MailModule } from 'src/mail/mail.module';
import { EmailVerificationModule } from 'src/email-verification/email-verification.module';
import { PasswordResetModule } from 'src/password-reset/password-reset.module';
import { MeetingsModule } from 'src/meetings/meetings.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import type { Request, Response } from 'express';
import { LoggerMiddleware } from 'src/middlewares/logger';
import { AiModule } from 'src/ai/ai.module';
import { AttendeesModule } from 'src/attendees/attendees.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, dbConfig, aiConfig, r2Config, mailConfig],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    MailModule,
    EmailVerificationModule,
    PasswordResetModule,
    MeetingsModule,
    AiModule,
    AttendeesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
