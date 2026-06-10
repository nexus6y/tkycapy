import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';

const KNOWN_KEYS = new Set([
  'code','name','type','isProjectContract','isFrameworkContract',
  'projectId','projectCode','projectName',
  'customerId','customerCode','customerName',
  'supplierId','supplierCode','supplierName',
  'organizationId','organizationName','category','purchaseMethod',
  'currencyType','receiptPaymentMethod','amountType',
  'taxMonth','performanceBond','performanceMode','performanceLocation',
  'effectiveDate','signDate','signUrl',
  'undertakingDepartmentId','undertakingDepartmentName',
  'undertakerName','undertakerPhone',
  'qualityRequirement','warrantyPeriod','disputeResolution','liabilityForBreach',
  'internalCode','legalCode',
  'startDate','endDate','totalAmount','approvalStatus','remark','tenantId',
]);

@Injectable()
export class ContractService {
  constructor(
    private prisma: PrismaService,
    private codeGen: CodeGeneratorService,
  ) {}

  private async tid() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  private cleanDto(dto: any): any {
    const data: any = {};
    for (const k of Object.keys(dto)) {
      if (KNOWN_KEYS.has(k)) data[k] = dto[k];
    }
    // Normalize: empty strings → delete (prevents Prisma Decimal/DateTime parse errors)
    this.normalizeData(data);
    return data;
  }

  /** Strip empty strings so Prisma never receives "" for Decimal/DateTime/Int fields */
  private normalizeData(data: any) {
    for (const k of Object.keys(data)) {
      if (data[k] === '' || data[k] === null) delete data[k];
    }
  }

  /** Convert counterparty fields: sales→keep customer/clear supplier, purchase→keep supplier/clear customer */
  private normalizeCounterparty(data: any) {
    if (data.type === '销售合同') {
      delete data.supplierId;
      delete data.supplierCode;
      delete data.supplierName;
    } else if (data.type === '采购合同') {
      delete data.customerId;
      delete data.customerCode;
      delete data.customerName;
    }
  }

  private convertDates(data: any) {
    const dateFields = ['startDate','endDate','effectiveDate','signDate','planDate'];
    for (const f of dateFields) {
      if (data[f]) data[f] = new Date(data[f]);
    }
  }

  private convertAmounts(data: any) {
    const amtFields = ['totalAmount','performanceBond'];
    for (const f of amtFields) {
      if (data[f] != null && data[f] !== '') data[f] = String(data[f]);
    }
  }

  async findAll(query: any) {
    const tenantId = await this.tid();
    const where: any = { tenantId };
    if (query.status) where.approvalStatus = query.status;
    if (query.code) where.code = { contains: query.code };
    if (query.name) where.name = { contains: query.name };
    if (query.category) where.category = query.category;
    if (query.counterparty) where.OR = [
      { customerName: { contains: query.counterparty } },
      { supplierName: { contains: query.counterparty } },
    ];
    if (query.organization) where.organizationName = { contains: query.organization };
    if (query.type) where.type = query.type;
    const page = +query.page || 1;
    const pageSize = +query.pageSize || 30;
    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.contract.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    return this.prisma.contract.findUniqueOrThrow({
      where: { id },
      include: {
        paymentPlans: { orderBy: { lineNo: 'asc' } },
        lines: { orderBy: { lineNo: 'asc' } },
        attachments: { orderBy: { uploadedAt: 'desc' } },
      },
    });
  }

  async create(dto: any) {
    const tenantId = await this.tid();
    const data = this.cleanDto(dto);
    data.tenantId = tenantId;
    if (!data.code) {
      data.code = await this.codeGen.generate(
        CodeGeneratorService.PREFIXES['contract'],
        'contract',
        'code',
      );
    }
    this.normalizeCounterparty(data);
    this.convertDates(data);
    this.convertAmounts(data);
    const { paymentPlans, lines, attachments } = dto as any;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const contract = await tx.contract.create({ data: data as any });

      if (paymentPlans && paymentPlans.length > 0) {
        await tx.contractPaymentPlan.createMany({
          data: paymentPlans.map((p: any, i: number) => ({
            contractId: contract.id,
            lineNo: p.lineNo || i + 1,
            amount: String(p.amount || 0),
            planDate: new Date(p.planDate),
            ratio: p.ratio || 0,
            remark: p.remark,
          })),
        });
      }

      if (lines && lines.length > 0) {
        await tx.contractLine.createMany({
          data: lines.map((l: any, i: number) => ({
            contractId: contract.id,
            lineNo: l.lineNo || i + 1,
            materialId: l.materialId,
            materialCode: l.materialCode,
            materialName: l.materialName,
            specification: l.specification || l.spec,
            unit: l.unit,
            quantity: l.quantity != null ? String(l.quantity) : '0',
            unitPrice: l.unitPrice != null ? String(l.unitPrice) : '0',
            amount: l.amount != null ? String(l.amount) : '0',
            remark: l.remark,
          })),
        });
      }

      if (attachments && attachments.length > 0) {
        await tx.contractAttachment.createMany({
          data: attachments.map((a: any) => ({
            contractId: contract.id,
            description: a.description,
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            fileId: a.fileId,
            uploadedBy: a.uploadedBy,
          })),
        });
      }

      return tx.contract.findUniqueOrThrow({
        where: { id: contract.id },
        include: {
          paymentPlans: { orderBy: { lineNo: 'asc' } },
          lines: { orderBy: { lineNo: 'asc' } },
          attachments: { orderBy: { uploadedAt: 'desc' } },
        },
      });
    });
    } catch (e: any) {
      this.handlePrismaError(e);
    }
  }

  async update(id: string, dto: any) {
    const { paymentPlans, lines, attachments, ...rawData } = dto as any;
    const contractData = this.cleanDto(rawData);
    this.normalizeCounterparty(contractData);
    this.convertDates(contractData);
    this.convertAmounts(contractData);

    try {
      return await this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.update({ where: { id }, data: contractData as any });

      // Replace payment plans
      if (paymentPlans !== undefined) {
        await tx.contractPaymentPlan.deleteMany({ where: { contractId: id } });
        if (paymentPlans.length > 0) {
          await tx.contractPaymentPlan.createMany({
            data: paymentPlans.map((p: any, i: number) => ({
              contractId: id,
              lineNo: p.lineNo || i + 1,
              amount: String(p.amount || 0),
              planDate: new Date(p.planDate),
              ratio: p.ratio || 0,
              remark: p.remark,
            })),
          });
        }
      }

      // Replace lines
      if (lines !== undefined) {
        await tx.contractLine.deleteMany({ where: { contractId: id } });
        if (lines.length > 0) {
          await tx.contractLine.createMany({
            data: lines.map((l: any, i: number) => ({
              contractId: id,
              lineNo: l.lineNo || i + 1,
              materialId: l.materialId,
              materialCode: l.materialCode,
              materialName: l.materialName,
              specification: l.specification || l.spec,
              unit: l.unit,
              quantity: l.quantity != null ? String(l.quantity) : '0',
              unitPrice: l.unitPrice != null ? String(l.unitPrice) : '0',
              amount: l.amount != null ? String(l.amount) : '0',
              remark: l.remark,
            })),
          });
        }
      }

      // Replace attachments
      if (attachments !== undefined) {
        await tx.contractAttachment.deleteMany({ where: { contractId: id } });
        if (attachments.length > 0) {
          await tx.contractAttachment.createMany({
            data: attachments.map((a: any) => ({
              contractId: id,
              description: a.description,
              fileName: a.fileName,
              fileUrl: a.fileUrl,
              fileId: a.fileId,
              uploadedBy: a.uploadedBy,
            })),
          });
        }
      }

      return tx.contract.findUniqueOrThrow({
        where: { id },
        include: {
          paymentPlans: { orderBy: { lineNo: 'asc' } },
          lines: { orderBy: { lineNo: 'asc' } },
          attachments: { orderBy: { uploadedAt: 'desc' } },
        },
      });
    });
    } catch (e: any) {
      this.handlePrismaError(e);
    }
  }

  private handlePrismaError(e: any): never {
    if (e.code === 'P2002') {
      const target = (e.meta?.target as any) ?? e.meta?.field_name as any ?? '';
      const field = Array.isArray(target) ? target.join(', ') : (String(target || '数据'));
      throw new HttpException(`唯一约束冲突：${field} 已存在`, HttpStatus.BAD_REQUEST);
    }
    if (e.code === 'P2003') {
      throw new HttpException('外键约束：关联数据不存在', HttpStatus.BAD_REQUEST);
    }
    if (e.code === 'P2025') {
      throw new HttpException('记录未找到，可能已被删除', HttpStatus.NOT_FOUND);
    }
    throw e;
  }

  async remove(id: string) {
    const contract = await this.prisma.contract.findUniqueOrThrow({ where: { id } });
    if (contract.approvalStatus === 'APPROVED') {
      throw new HttpException('已通过审批的合同不可删除', HttpStatus.BAD_REQUEST);
    }
    if (contract.approvalStatus === 'SUBMITTED') {
      throw new HttpException('已提交的合同请先撤回再删除', HttpStatus.BAD_REQUEST);
    }
    // Check if referenced by orders
    const refCount = await this.prisma.salesOrder.count({ where: { contractId: id } }) +
      await this.prisma.purchaseOrder.count({ where: { contractId: id } });
    if (refCount > 0) {
      throw new HttpException('合同已被订单引用，不可删除', HttpStatus.BAD_REQUEST);
    }
    await this.prisma.contract.delete({ where: { id } });
    return { message: '删除成功' };
  }

  async submit(id: string) {
    const c = await this.prisma.contract.findUniqueOrThrow({ where: { id } });
    if (c.approvalStatus !== 'DRAFT' && c.approvalStatus !== 'REJECTED') {
      throw new HttpException('只有草稿或已拒绝状态可提交', HttpStatus.BAD_REQUEST);
    }
    return this.prisma.contract.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  async approve(id: string) {
    const c = await this.prisma.contract.findUniqueOrThrow({ where: { id } });
    if (c.approvalStatus !== 'SUBMITTED') {
      throw new HttpException('只有已提交状态可审批通过', HttpStatus.BAD_REQUEST);
    }
    return this.prisma.contract.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
  }

  async reject(id: string) {
    const c = await this.prisma.contract.findUniqueOrThrow({ where: { id } });
    if (c.approvalStatus !== 'SUBMITTED') {
      throw new HttpException('只有已提交状态可拒绝', HttpStatus.BAD_REQUEST);
    }
    return this.prisma.contract.update({ where: { id }, data: { approvalStatus: 'REJECTED' } as any });
  }

  async withdraw(id: string) {
    const c = await this.prisma.contract.findUniqueOrThrow({ where: { id } });
    if (c.approvalStatus !== 'SUBMITTED') {
      throw new HttpException('只有已提交状态可撤回', HttpStatus.BAD_REQUEST);
    }
    return this.prisma.contract.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any });
  }
}
