import { Module } from '@nestjs/common';
import { ActionItemsService } from './action-items.service';
import { ActionItemFieldsResolver, ActionItemsResolver } from './action-items.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionItem, ActionItemSchema } from './schemas/actionItem.schema';
import { AttendeesModule } from 'src/attendees/attendees.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [ActionItemsResolver, ActionItemFieldsResolver, ActionItemsService],
  imports: [
    MongooseModule.forFeature([
      {
        name: ActionItem.name,
        schema: ActionItemSchema,
      },
    ]),
    AttendeesModule,
    AuthModule,
  ],
  exports: [ActionItemsService],
})
export class ActionItemsModule {}
