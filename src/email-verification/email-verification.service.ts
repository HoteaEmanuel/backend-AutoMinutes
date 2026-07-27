import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { EmailVerification } from './schemas/email-verification.schema';
import { MailService } from 'src/mail/mail.service';
import { verificationCodeTemplate } from 'src/mail/templates/verification-code.template';

const CODE_TTL_MS = 15 * 60 * 1000;
const CODE_TTL_MINUTES = CODE_TTL_MS / (60 * 1000);
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS = 10;
const SALT_ROUNDS = 12;

type IssueParams = {
  userId: Types.ObjectId;
  email: string;
  firstName: string;
};

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectModel(EmailVerification.name) private readonly model: Model<EmailVerification>,
    private readonly mailService: MailService,
  ) {}

  private generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private async sendCodeEmail(email: string, firstName: string, code: string) {
    const { subject, html, text } = verificationCodeTemplate({
      firstName,
      code,
      expiresInMinutes: CODE_TTL_MINUTES,
    });
    await this.mailService.send({ to: email, subject, html, text });
  }

  async issueCode({ userId, email, firstName }: IssueParams) {
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const now = new Date();

    await this.model.findOneAndUpdate(
      { userId },
      {
        $set: {
          email,
          codeHash,
          expiresAt: new Date(now.getTime() + CODE_TTL_MS),
          attempts: 0,
          lastSentAt: now,
        },
        $inc: { sendCount: 1 },
        $setOnInsert: { userId },
      },
      { upsert: true, new: true },
    );

    await this.sendCodeEmail(email, firstName, code);
  }

  async resendCode({ userId, email, firstName }: IssueParams) {
    const record = await this.model.findOne({ userId });

    if (record) {
      const elapsed = Date.now() - record.lastSentAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new HttpException(
          {
            message: `Please wait ${retryAfterSeconds}s before requesting a new code.`,
            code: 'RESEND_COOLDOWN',
            retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (record.sendCount >= MAX_SENDS) {
        throw new HttpException(
          {
            message: 'Too many codes requested. Please try again in 15 minutes.',
            code: 'RESEND_LIMIT',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    await this.issueCode({ userId, email, firstName });
  }

  async consumeCode(userId: Types.ObjectId, code: string) {
    const record = await this.model.findOne({ userId });
    if (!record) throw new BadRequestException('No pending verification. Request a new code.');

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.model.deleteOne({ userId });
      throw new BadRequestException('This code has expired. Request a new one.');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await this.model.deleteOne({ userId });
      throw new BadRequestException('Too many incorrect attempts. Request a new code.');
    }

    const matches = await bcrypt.compare(code, record.codeHash);
    if (!matches) {
      const updated = await this.model.findOneAndUpdate(
        { userId },
        { $inc: { attempts: 1 } },
        { new: true },
      );
      const attempts = updated?.attempts ?? MAX_ATTEMPTS;
      const left = Math.max(MAX_ATTEMPTS - attempts, 0);

      if (left === 0) await this.model.deleteOne({ userId });

      throw new BadRequestException(
        left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`
          : 'Too many incorrect attempts. Request a new code.',
      );
    }

    await this.model.deleteOne({ userId });
  }
}
