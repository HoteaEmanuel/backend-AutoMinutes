import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiResolver } from './ai.resolver';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AIResults, AIResultsSchema } from './schemas/aiResults.schema';
import { AttendeesModule } from 'src/attendees/attendees.module';
import { ActionItemsModule } from 'src/action-items/action-items.module';

@Module({
  providers: [AiResolver, AiService],
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: AIResults.name,
        schema: AIResultsSchema,
      },
    ]),
    AttendeesModule,
    ActionItemsModule,
  ],
})
export class AiModule {}
