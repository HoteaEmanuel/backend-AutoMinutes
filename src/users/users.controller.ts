import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import sharp from 'sharp';
import { UsersService } from './users.service';
import { R2Service } from './storage/r2.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { type AuthenticatedUser } from '../types/express';

const AVATAR_SIZE = 512;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly r2Service: R2Service,
  ) {}

  @Post('me/avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  async uploadAvatar(
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!file.mimetype.startsWith('image/'))
      throw new BadRequestException('Uploaded file must be an image');

    // Re-encodam serverside: patrat fix, webp, fara metadate EXIF/polyglot
    let processed: Buffer;
    try {
      processed = await sharp(file.buffer)
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      throw new BadRequestException('Invalid image file');
    }

    const previousAvatar = (await this.usersService.findById(currentUser.userId)).avatar;

    const key = `avatars/${currentUser.userId}-${Date.now()}.webp`;
    const url = await this.r2Service.upload(key, processed, 'image/webp');

    const user = await this.usersService.update(currentUser.userId, { avatar: url });

    // Curatam vechiul avatar din R2 (daca era gazduit de noi) ca sa nu ramana orfan
    const previousKey = this.r2Service.keyFromUrl(previousAvatar);
    if (previousKey && previousKey !== key) await this.r2Service.delete(previousKey);

    return user;
  }
}
