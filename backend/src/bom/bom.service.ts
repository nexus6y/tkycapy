import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../common/code-generator.service';

@Injectable()
export class BomService {
  constructor(
    private prisma: PrismaService,
    private codeGen: CodeGeneratorService,
  ) {}

  async tid() {
    return (await this.prisma.tenant.findUniqueOrThrow({ where: { code: 'default' } })).id;
  }

  async findAll(query: { status?: string; code?: string; name?: string; productCode?: string; productName?: string; version?: string; enabled?: string; page?: number; pageSize?: number }) {
    const tenantId = await this.tid();
    const where: any = { tenantId };
    if (query.status) where.approvalStatus = query.status;
    if (query.code) where.code = { contains: query.code };
    if (query.name) where.name = { contains: query.name };
    if (query.productCode) where.productMaterialCode = { contains: query.productCode };
    if (query.productName) where.productMaterialName = { contains: query.productName };
    if (query.version) where.version = { contains: query.version };
    if (query.enabled) where.status = query.enabled;
    const page = query.page || 1;
    const pageSize = query.pageSize || 30;
    const [items, total] = await Promise.all([
      this.prisma.bom.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +pageSize, take: +pageSize }),
      this.prisma.bom.count({ where }),
    ]);
    return { items, total, page: +page, pageSize: +pageSize };
  }

  async findOne(id: string) {
    return this.prisma.bom.findUniqueOrThrow({
      where: { id },
      include: { items: { orderBy: { lineNo: 'asc' } } },
    });
  }

  private KNOWN_BOM_KEYS = new Set([
    'code','name','productMaterialId','productMaterialCode','productMaterialName',
    'productSpec','productUnit','version','baseQty','effectiveDate','expireDate',
    'status','approvalStatus','remark','tenantId',
  ]);

  async create(dto: any) {
    const tenantId = await this.tid();
    const { items, ...rawBomData } = dto;

    // Auto-generate code if not provided
    if (!rawBomData.code) {
      rawBomData.code = await this.codeGen.generate('BOM', 'bom', 'code');
    }

    // Map frontend field names to Prisma field names
    if (rawBomData.productQuantity && !rawBomData.baseQty) {
      rawBomData.baseQty = rawBomData.productQuantity;
    }

    // Filter to known Bom fields only
    const bomData: any = {};
    for (const k of Object.keys(rawBomData)) {
      if (this.KNOWN_BOM_KEYS.has(k)) bomData[k] = rawBomData[k];
    }
    // Strip empty date strings that Prisma can't convert
    for (const k of ['effectiveDate', 'expireDate']) {
      if (bomData[k] === '' || bomData[k] === null || bomData[k] === undefined) delete bomData[k];
    }
    return this.prisma.$transaction(async (tx) => {
      const bom = await tx.bom.create({ data: { ...bomData, tenantId } as any });
      if (items && items.length > 0) {
        // Resolve materialId from materialCode for each item
        const matCodes = [...new Set(items.map((i: any) => i.materialCode).filter(Boolean))] as string[];
        const matIdMap = new Map<string, string>();
        if (matCodes.length > 0) {
          const mats = await tx.material.findMany({
            where: { tenantId, code: { in: matCodes } },
            select: { id: true, code: true },
          });
          for (const m of mats) matIdMap.set(m.code, m.id);
        }
        await tx.bomItem.createMany({
          data: items.map((item: any, idx: number) => ({
            bomId: bom.id,
            lineNo: item.lineNo || idx + 1,
            ...item,
            materialId: item.materialId || matIdMap.get(item.materialCode) || '',
          })),
        });
      }
      return tx.bom.findUniqueOrThrow({ where: { id: bom.id }, include: { items: { orderBy: { lineNo: 'asc' } } } });
    });
  }

  async update(id: string, dto: any) {
    const tenantId = await this.tid();
    const { items, ...rawBomData } = dto;

    // Map frontend field names to Prisma field names
    if (rawBomData.productQuantity && !rawBomData.baseQty) {
      rawBomData.baseQty = rawBomData.productQuantity;
    }

    // Filter to known Bom fields only (same whitelist as create)
    const bomData: any = {};
    for (const k of Object.keys(rawBomData)) {
      if (this.KNOWN_BOM_KEYS.has(k)) bomData[k] = rawBomData[k];
    }
    // Strip empty date strings that Prisma can't convert
    for (const k of ['effectiveDate', 'expireDate']) {
      if (bomData[k] === '' || bomData[k] === null || bomData[k] === undefined) delete bomData[k];
    }

    return this.prisma.$transaction(async (tx) => {
      const bom = await tx.bom.update({ where: { id }, data: bomData as any });
      if (items !== undefined) {
        await tx.bomItem.deleteMany({ where: { bomId: id } });
        if (items.length > 0) {
          // Resolve materialId from materialCode (same as create)
          const matCodes = [...new Set(items.map((i: any) => i.materialCode).filter(Boolean))] as string[];
          const matIdMap = new Map<string, string>();
          if (matCodes.length > 0) {
            const mats = await tx.material.findMany({
              where: { tenantId, code: { in: matCodes } },
              select: { id: true, code: true },
            });
            for (const m of mats) matIdMap.set(m.code, m.id);
          }
          await tx.bomItem.createMany({
            data: items.map((item: any, idx: number) => {
              // Strip non-updatable fields from old items
              const { id: _id, bomId: _bid, tenantId: _tid, createdAt: _ca, updatedAt: _ua, ...cleanItem } = item;
              return {
                bomId: id,
                lineNo: cleanItem.lineNo || idx + 1,
                ...cleanItem,
                materialId: cleanItem.materialId || matIdMap.get(cleanItem.materialCode) || '',
              };
            }),
          });
        }
      }
      return tx.bom.findUniqueOrThrow({ where: { id }, include: { items: { orderBy: { lineNo: 'asc' } } } });
    });
  }

  async remove(id: string) {
    await this.prisma.bom.delete({ where: { id } });
    return { message: '删除成功' };
  }

  async submit(id: string) {
    const bom = await this.prisma.bom.findUniqueOrThrow({ where: { id } });
    if (bom.approvalStatus !== 'DRAFT') throw new Error('只有草稿状态可提交');
    return this.prisma.bom.update({ where: { id }, data: { approvalStatus: 'SUBMITTED' } as any });
  }

  async approve(id: string) {
    const bom = await this.prisma.bom.findUniqueOrThrow({ where: { id } });
    if (bom.approvalStatus !== 'SUBMITTED') throw new Error('只有已提交状态可审批');
    return this.prisma.bom.update({ where: { id }, data: { approvalStatus: 'APPROVED' } as any });
  }

  async reject(id: string) {
    const bom = await this.prisma.bom.findUniqueOrThrow({ where: { id } });
    if (bom.approvalStatus !== 'SUBMITTED') throw new Error('只有已提交状态可拒绝');
    return this.prisma.bom.update({ where: { id }, data: { approvalStatus: 'REJECTED' } as any });
  }

  async withdraw(id: string) {
    const bom = await this.prisma.bom.findUniqueOrThrow({ where: { id } });
    if (bom.approvalStatus !== 'SUBMITTED') throw new Error('只有已提交状态可撤回');
    return this.prisma.bom.update({ where: { id }, data: { approvalStatus: 'DRAFT' } as any });
  }

  async copy(id: string, newVersion?: string) {
    const tenantId = await this.tid();
    const original = await this.prisma.bom.findUniqueOrThrow({
      where: { id },
      include: { items: { orderBy: { lineNo: 'asc' } } },
    });
    return this.prisma.$transaction(async (tx) => {
      const newCode = original.code + '-CP';
      const { id: _id, updatedAt: _ua, deletedAt: _da, items: _items, tenant: _t, ...bomCopy } = original as any;
      const bom = await tx.bom.create({
        data: {
          ...bomCopy,
          code: newCode,
          version: newVersion || original.version,
          approvalStatus: 'DRAFT',
          status: 'ACTIVE',
          tenantId,
        } as any,
      });
      if (original.items.length > 0) {
        await tx.bomItem.createMany({
          data: original.items.map((item: any) => {
            const { id: _iid, bomId: _bid, updatedAt: _iua, ...itemCopy } = item;
            return { ...itemCopy, bomId: bom.id };
          }),
        });
      }
      return tx.bom.findUniqueOrThrow({ where: { id: bom.id }, include: { items: { orderBy: { lineNo: 'asc' } } } });
    });
  }

  async explode(id: string, qty: number = 1) {
    const bom = await this.prisma.bom.findUniqueOrThrow({
      where: { id },
      include: { items: { orderBy: { lineNo: 'asc' } } },
    });
    const ratio = qty / Number(bom.baseQty || 1);
    const requiredItems = bom.items.map((item) => {
      const baseQty = Number(item.quantity);
      const lossRate = Number(item.lossRate || 0);
      const requiredQty = baseQty * ratio * (1 + lossRate / 100);
      return {
        ...item,
        baseQty: baseQty,
        lossRate: lossRate,
        requiredQty: Math.round(requiredQty * 1000000) / 1000000,
        ratio,
      };
    });
    return {
      bom: {
        id: bom.id, code: bom.code, name: bom.name,
        productMaterialId: bom.productMaterialId,
        productMaterialCode: bom.productMaterialCode,
        productMaterialName: bom.productMaterialName,
        productSpec: bom.productSpec, productUnit: bom.productUnit,
        version: bom.version, baseQty: Number(bom.baseQty || 1),
      },
      requestQty: qty,
      ratio,
      items: requiredItems,
      totalItemCount: requiredItems.length,
    };
  }

  async diff(aId: string, bId: string) {
    const [bomA, bomB] = await Promise.all([
      this.prisma.bom.findUniqueOrThrow({ where: { id: aId }, include: { items: true } }),
      this.prisma.bom.findUniqueOrThrow({ where: { id: bId }, include: { items: true } }),
    ]);

    // Build maps keyed by materialId (or materialCode if no id)
    const mapA = new Map(bomA.items.map(i => [i.materialId, i]));
    const mapB = new Map(bomB.items.map(i => [i.materialId, i]));

    const diffs: any[] = [];

    // Items in B not in A → added
    for (const [mId, itemB] of mapB) {
      if (!mapA.has(mId)) {
        diffs.push({
          changeType: 'added',
          materialCode: itemB.materialCode,
          materialName: itemB.materialName,
          spec: itemB.spec,
          unit: itemB.unit,
          quantityB: Number(itemB.quantity),
          lossRateB: Number(itemB.lossRate || 0),
          warehouseB: itemB.warehouseName,
          processB: itemB.processName,
        });
      }
    }

    // Items in A but not in B → removed
    for (const [mId, itemA] of mapA) {
      if (!mapB.has(mId)) {
        diffs.push({
          changeType: 'removed',
          materialCode: itemA.materialCode,
          materialName: itemA.materialName,
          spec: itemA.spec,
          unit: itemA.unit,
          quantityA: Number(itemA.quantity),
          lossRateA: Number(itemA.lossRate || 0),
          warehouseA: itemA.warehouseName,
          processA: itemA.processName,
        });
      }
    }

    // Items in both → compare fields
    for (const [mId, itemA] of mapA) {
      const itemB = mapB.get(mId);
      if (!itemB) continue;

      const qtyA = Number(itemA.quantity);
      const qtyB = Number(itemB.quantity);
      const lossA = Number(itemA.lossRate || 0);
      const lossB = Number(itemB.lossRate || 0);
      const whA = itemA.warehouseName || '';
      const whB = itemB.warehouseName || '';
      const procA = itemA.processName || '';
      const procB = itemB.processName || '';

      const changed =
        qtyA !== qtyB || lossA !== lossB || whA !== whB || procA !== procB;

      if (changed) {
        diffs.push({
          changeType: 'changed',
          materialCode: itemA.materialCode,
          materialName: itemA.materialName,
          spec: itemA.spec,
          unit: itemA.unit,
          quantityA: qtyA,
          quantityB: qtyB,
          lossRateA: lossA,
          lossRateB: lossB,
          warehouseA: whA,
          warehouseB: whB,
          processA: procA,
          processB: procB,
        });
      } else {
        diffs.push({
          changeType: 'unchanged',
          materialCode: itemA.materialCode,
          materialName: itemA.materialName,
          spec: itemA.spec,
          unit: itemA.unit,
          quantity: qtyA,
          lossRate: lossA,
        });
      }
    }

    return {
      bomA: { id: bomA.id, code: bomA.code, name: bomA.name, version: bomA.version },
      bomB: { id: bomB.id, code: bomB.code, name: bomB.name, version: bomB.version },
      diffs,
      summary: {
        added: diffs.filter(d => d.changeType === 'added').length,
        removed: diffs.filter(d => d.changeType === 'removed').length,
        changed: diffs.filter(d => d.changeType === 'changed').length,
        unchanged: diffs.filter(d => d.changeType === 'unchanged').length,
        total: diffs.length,
      },
    };
  }
}
