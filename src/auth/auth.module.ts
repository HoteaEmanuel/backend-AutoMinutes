import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '@users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { TokenService } from './token.service';
import googleOauthConfig from './config/google-oauth.config';

@Module({
  providers: [AuthService, AuthGuard, TokenService],
  imports: [
    ConfigModule,
    ConfigModule.forFeature(googleOauthConfig),
    UsersModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  exports: [AuthGuard, TokenService],
})
export class AuthModule {}
