import { Controller, Get, Put, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('quality-params')
export class QualityParamController {
  constructor(private prisma: PrismaService) {}

  private async getTenantId() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  @Get()
  async get() {
    const tenantId = await this.getTenantId();
    let param = await this.prisma.qualityParam.findUnique({ where: { tenantId } });
    if (!param) {
      param = await this.prisma.qualityParam.create({
        data: { tenantId } as any,
      });
    }
    return param;
  }

  @Put()
  async update(@Body() dto: { autoApproval?: boolean; defectRateThreshold?: string; inspectionTemplate?: string }) {
    const tenantId = await this.getTenantId();
    return this.prisma.qualityParam.upsert({
      where: { tenantId },
      create: { tenantId, ...dto } as any,
      update: dto as any,
    });
  }
}
