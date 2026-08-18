import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import mailConfig from '../config/mail.config';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;

  constructor(
    @Inject(mailConfig.KEY)
    private readonly config: ConfigType<typeof mailConfig>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.password,
      },
    });
  }

  async send(mail: { to: string; subject: string; html: string; text: string }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.from,
        ...mail,
      });
    } catch (error) {
      console.error('Mail send failed', error);
      throw new InternalServerErrorException('Could not send the verification email');
    }
  }
}
