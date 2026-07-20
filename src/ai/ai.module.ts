import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiResolver } from './ai.resolver';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [AiResolver, AiService],
  imports: [AuthModule],
})
export class AiModule {}
