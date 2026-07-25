import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
      const existingUser = await this.userModel.findOne({ email: createUserDto.email });
      if (existingUser) throw new ConflictException('A user with this email already exists');
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
    if (!passwordsMatch) throw new UnauthorizedException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    return true;
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
    if (existing) return existing;

    return await this.userModel.create({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      provider: 'google',
    });
  }

  async findByEmail(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .select({ passwordHash: true, email: true })
      .lean();
    if (!user) throw new NotFoundException(`User with email: ${email} was not found`);
    return user;
  }

  // findOne(id: number): User {
  //   const user = this.users.find((u) => u.id === id);
  //   if (!user) throw new NotFoundException(`User #${id} not found`);
  //   return user;
  // }

  // update(id: number, updateUserDto: UpdateUserDto): User {
  //   const user = this.findOne(id);
  //   Object.assign(user, updateUserDto);
  //   return user;
  // }

  // remove(id: number): User {
  //   const index = this.users.findIndex((u) => u.id === id);
  //   if (index === -1) throw new NotFoundException(`User #${id} not found`);
  //   const [removed] = this.users.splice(index, 1);
  //   return removed;
  // }
}
