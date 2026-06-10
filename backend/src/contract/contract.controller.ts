import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  HttpException, HttpStatus, UseInterceptors, UploadedFile, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Response } from 'express';
import { ContractService } from './contract.service';
import { getUploadsDir } from '../common/uploads-path';

@Controller('contracts')
export class ContractController {
  constructor(private readonly service: ContractService) {}

  // ========== 列表 ==========

  @Get()
  async findAll(
    @Query('code') code?: string,
    @Query('name') name?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('counterparty') counterparty?: string,
    @Query('organization') organization?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll({
      code, name, type, category, counterparty, organization, status,
      page: page ? +page : 1, pageSize: pageSize ? +pageSize : 30,
    });
  }

  // ========== 详情（含子表）==========

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ========== 创建（含子表事务）==========

  @Post()
  async create(@Body() dto: any) {
    return this.service.create(dto);
  }

  // ========== 更新（含子表事务）==========

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  // ========== 删除 ==========

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ========== 审批流 ==========

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    try {
      return await this.service.submit(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    try {
      return await this.service.approve(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string) {
    try {
      return await this.service.reject(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    try {
      return await this.service.withdraw(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ========== 文件上传 ==========

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = getUploadsDir('contracts');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new HttpException('未选择文件', HttpStatus.BAD_REQUEST);
    return {
      fileId: file.filename,
      fileName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      fileUrl: `/uploads/contracts/${file.filename}`,
      size: file.size,
    };
  }
}
