import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { BomService } from './bom.service';

@Controller('boms')
export class BomController {
  constructor(private bomService: BomService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('code') code?: string,
    @Query('name') name?: string,
    @Query('productCode') productCode?: string,
    @Query('productName') productName?: string,
    @Query('version') version?: string,
    @Query('enabled') enabled?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.bomService.findAll({ status, code, name, productCode, productName, version, enabled, page, pageSize });
  }

  @Get('diff')
  async diff(@Query('a') aId: string, @Query('b') bId: string) {
    if (!aId || !bId) throw new HttpException('请提供 a 和 b 参数', HttpStatus.BAD_REQUEST);
    return this.bomService.diff(aId, bId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bomService.findOne(id);
  }

  @Get(':id/explode')
  async explode(@Param('id') id: string, @Query('qty') qty: number = 1) {
    if (qty <= 0) throw new HttpException('生产数量必须大于0', HttpStatus.BAD_REQUEST);
    return this.bomService.explode(id, qty);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.bomService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.bomService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.bomService.remove(id);
  }

  @Put(':id/submit')
  async submit(@Param('id') id: string) {
    try { return this.bomService.submit(id); }
    catch (e: any) { throw new HttpException(e.message, HttpStatus.BAD_REQUEST); }
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    try { return this.bomService.approve(id); }
    catch (e: any) { throw new HttpException(e.message, HttpStatus.BAD_REQUEST); }
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string) {
    try { return this.bomService.reject(id); }
    catch (e: any) { throw new HttpException(e.message, HttpStatus.BAD_REQUEST); }
  }

  @Put(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    try { return this.bomService.withdraw(id); }
    catch (e: any) { throw new HttpException(e.message, HttpStatus.BAD_REQUEST); }
  }

  @Post(':id/copy')
  async copy(@Param('id') id: string, @Body('newVersion') newVersion?: string) {
    return this.bomService.copy(id, newVersion);
  }
}
