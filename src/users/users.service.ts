import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
      const userCreated = await this.userModel.create({
        passwordHash: hashedPassword,
        ...createUserDto,
      });
      return userCreated;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.log(error);
      throw new Error();
    }
  }

  async findAll() {
    return await this.userModel.find({});
  }

  async findById(_id: string) {
    const user = await this.userModel.findOne({ _id: new Types.ObjectId(_id) });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(userId: string, update: Partial<Pick<User, 'firstName' | 'lastName' | 'avatar'>>) {
    const user = await this.userModel.findByIdAndUpdate(new Types.ObjectId(userId), update, {
      new: true,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel
      .findOne({ _id: new Types.ObjectId(userId) })
      .select('+passwordHash');
    if (!user) throw new NotFoundException('User not found');

    if (!user.passwordHash)
      throw new BadRequestException(
        'This account signed in with Google and has no password to change',
      );

    const passwordsMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordsMatch) throw new BadRequestException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    return true;
  }

  async hasPassword(userId: string): Promise<boolean> {
    const user = await this.userModel.exists({
      _id: new Types.ObjectId(userId),
      passwordHash: { $exists: true, $ne: null },
    });
    return !!user;
  }

  async setPassword(userId: string, newPassword: string) {
    const user = await this.userModel
      .findOne({ _id: new Types.ObjectId(userId) })
      .select('+passwordHash');
    if (!user) throw new NotFoundException('User not found');

    if (user.passwordHash)
      throw new BadRequestException(
        'This account already has a password. Use change password instead.',
      );

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    return true;
  }

  async remove(userId: string) {
    const user = await this.userModel.findByIdAndDelete(new Types.ObjectId(userId));
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOrCreateGoogleUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }) {
    const existing = await this.userModel.findOne({ email: profile.email });
    if (existing) {
      if (!existing.emailVerified) {
        await this.userModel.updateOne(
          { _id: existing._id },
          { $set: { emailVerified: true }, $unset: { passwordHash: '' } },
        );
        existing.emailVerified = true;
      }
      return existing;
    }

    return await this.userModel.create({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      provider: 'google',
      emailVerified: true,
    });
  }

  async findByEmailOrNull(email: string) {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash')
      .lean();
  }

  async markEmailVerified(userId: Types.ObjectId | string) {
    const user = await this.userModel.findByIdAndUpdate(
      new Types.ObjectId(userId),
      { emailVerified: true },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setPasswordHash(userId: Types.ObjectId | string, passwordHash: string) {
    const user = await this.userModel.findByIdAndUpdate(
      new Types.ObjectId(userId),
      { passwordHash },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
