import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '@users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { TokenService } from './token.service';

@Module({
  providers: [AuthService, AuthGuard, TokenService],
  imports: [ConfigModule, UsersModule, JwtModule.register({}), AuthModule],
  controllers: [AuthController],
})
export class AuthModule {}
