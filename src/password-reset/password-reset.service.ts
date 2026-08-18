import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes, createHash } from 'node:crypto';
import { PasswordReset } from './schemas/password-reset.schema';
import { MailService } from '../mail/mail.service';
import {
  passwordResetTemplate,
  googleAccountNoticeTemplate,
} from '../mail/templates/password-reset.template';

const TOKEN_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS = 5;

type RequestResetParams = {
  userId: Types.ObjectId;
  email: string;
  firstName: string;
};

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectModel(PasswordReset.name) private readonly model: Model<PasswordReset>,
    private readonly mailService: MailService,
  ) {}

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async requestReset({ userId, email, firstName }: RequestResetParams) {
    const record = await this.model.findOne({ userId });

    if (record) {
      const elapsed = Date.now() - record.lastSentAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new HttpException(
          {
            message: `Please wait ${retryAfterSeconds}s before requesting another reset link.`,
            code: 'RESEND_COOLDOWN',
            retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (record.sendCount >= MAX_SENDS) {
        throw new HttpException(
          {
            message: 'Too many reset attempts. Please try again in an hour.',
            code: 'RESEND_LIMIT',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    const now = new Date();

    await this.model.findOneAndUpdate(
      { userId },
      {
        $set: {
          email,
          tokenHash,
          expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
          lastSentAt: now,
        },
        $inc: { sendCount: 1 },
        $setOnInsert: { userId },
      },
      { upsert: true, new: true },
    );

    const { subject, html, text } = passwordResetTemplate({
      firstName,
      resetUrl: `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`,
      expiresInMinutes: TOKEN_TTL_MS / (60 * 1000),
    });
    await this.mailService.send({ to: email, subject, html, text });
  }

  async notifyGoogleOnlyAccount(email: string, firstName: string): Promise<void> {
    const { subject, html, text } = googleAccountNoticeTemplate({ firstName });
    await this.mailService.send({ to: email, subject, html, text });
  }

  async consumeToken(token: string): Promise<Types.ObjectId> {
    const tokenHash = this.hashToken(token);
    const record = await this.model.findOne({ tokenHash });
    if (!record)
      throw new BadRequestException('This reset link is invalid or has already been used.');

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.model.deleteOne({ _id: record._id });
      throw new BadRequestException('This reset link has expired. Request a new one.');
    }

    await this.model.deleteOne({ _id: record._id });
    return record.userId;
  }
}
