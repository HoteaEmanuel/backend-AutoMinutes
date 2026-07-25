import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import r2Config from '@config/r2.config';

@Injectable()
export class R2Service {
  private readonly client: S3Client;

  constructor(
    @Inject(r2Config.KEY)
    private readonly config: ConfigType<typeof r2Config>,
  ) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId!,
        secretAccessKey: this.config.secretAccessKey!,
      },
    });
  }
  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return `${this.config.publicUrl}/${key}`;
    } catch (error) {
      console.error('R2 upload failed', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      console.error('R2 delete failed', error);
    }
  }

  keyFromUrl(url?: string | null): string | null {
    if (!url || !this.config.publicUrl) return null;
    const base = `${this.config.publicUrl}/`;
    return url.startsWith(base) ? url.slice(base.length) : null;
  }
}
