import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Controller('operation-logs')
export class OperationLogController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const [items, total] = await Promise.all([this.prisma.operationLog.findMany({ orderBy: { operatedAt: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.operationLog.count()]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
}
@Controller('login-logs')
export class LoginLogController {
  constructor(private prisma: PrismaService) {}
  @Get() async findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 30) {
    const [items, total] = await Promise.all([this.prisma.loginLog.findMany({ orderBy: { loginTime: 'desc' }, skip: (+page-1)*+pageSize, take: +pageSize }), this.prisma.loginLog.count()]);
    return { items, total, page: +page, pageSize: +pageSize };
  }
}
