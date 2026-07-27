import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '@users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { TokenService } from './token.service';
import googleOauthConfig from './config/google-oauth.config';
import { EmailVerificationModule } from 'src/email-verification/email-verification.module';
import { PasswordResetModule } from 'src/password-reset/password-reset.module';

@Module({
  providers: [AuthService, AuthGuard, TokenService],
  imports: [
    ConfigModule,
    ConfigModule.forFeature(googleOauthConfig),
    forwardRef(() => UsersModule),
    JwtModule.register({}),
    EmailVerificationModule,
    PasswordResetModule,
  ],
  controllers: [AuthController],
  exports: [AuthGuard, TokenService],
})
export class AuthModule {}
