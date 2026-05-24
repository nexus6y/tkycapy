import { Controller, Get, Put, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('material-params')
export class MaterialParamController {
  constructor(private prisma: PrismaService) {}

  private async getTenantId() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  @Get()
  async get() {
    const tenantId = await this.getTenantId();
    let param = await this.prisma.materialParam.findUnique({ where: { tenantId } });
    if (!param) {
      param = await this.prisma.materialParam.create({
        data: { tenantId, codeFormat: 'MAT{yyyyMM}{seq:4}', allowDuplicateName: false, autoApproval: false, defaultStatus: 'ACTIVE' } as any,
      });
    }
    return param;
  }

  @Put()
  async update(@Body() dto: { codeFormat?: string; allowDuplicateName?: boolean; autoApproval?: boolean; defaultStatus?: string }) {
    const tenantId = await this.getTenantId();
    const data = { ...dto, defaultStatus: dto.defaultStatus as any };
    return this.prisma.materialParam.upsert({
      where: { tenantId },
      create: { tenantId, ...data } as any,
      update: data as any,
    });
  }
}
