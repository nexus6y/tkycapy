import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { getUploadsDir } from './common/uploads-path';

// Map DTO field names to Chinese labels for validation errors
const FIELD_LABELS: Record<string, string> = {
  code: '编号', name: '名称', categoryId: '1级分类', unitId: '计量单位',
  materialType: '物料性质', productCategory: '产品分类', specification: '规格型号',
  externalCode: '外部编码', materialProperty: '物料属性', sortOrder: '排序',
  status: '状态', remark: '备注', planAttribute: '计划属性',
  username: '用户名', password: '密码', email: '邮箱', phone: '手机号',
  description: '描述', parentId: '上级分类', orderNo: '订单号', orderName: '订单名称',
  customerName: '客户名称', supplierId: '供应商', projectName: '项目名称',
  totalAmount: '金额', deliveryDate: '交付日期', quantity: '数量',
  warehouseId: '仓库', departmentId: '部门', quotationNo: '报价单号',
  quotationName: '报价名称', type: '类型', roleId: '角色',
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure uploads directory exists
  const uploadsDir = getUploadsDir();
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

  // Serve uploaded files at /uploads/... (before /api prefix applies)
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  app.enableCors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(e => {
        const label = FIELD_LABELS[e.property] || e.property;
        const constraints = Object.values(e.constraints || {});
        return `${label}: ${constraints.join('; ')}`;
      });
      return new BadRequestException(messages.join('；'));
    },
  }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3001);
  console.log('Backend running on http://localhost:3001');
}
bootstrap();
