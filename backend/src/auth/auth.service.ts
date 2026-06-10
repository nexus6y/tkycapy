import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException('用户名已存在');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashed,
        name: dto.name,
        tenantId: 'default',
      },
    });

    const { password, ...rest } = user;
    return { user: rest, token: this.signToken(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('用户名或密码错误');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('用户名或密码错误');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { password, ...rest } = user;
    return { user: rest, token: this.signToken(user) };
  }

  private signToken(user: { id: string; username: string }) {
    return jwt.sign(
      { sub: user.id, username: user.username },
      process.env.JWT_SECRET || 'change-me',
      { expiresIn: 604800 },
    );
  }
}
