import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordReset, PasswordResetSchema } from './schemas/password-reset.schema';
import { PasswordResetService } from './password-reset.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PasswordReset.name, schema: PasswordResetSchema }]),
    MailModule,
  ],
  providers: [PasswordResetService],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}
