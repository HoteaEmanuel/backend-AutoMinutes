import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
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
    const user = await this.userModel.findOne({ _id });
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
