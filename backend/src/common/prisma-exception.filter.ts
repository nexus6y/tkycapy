import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    let message = '数据库操作失败';
    let status = HttpStatus.BAD_REQUEST;

    switch (exception.code) {
      case 'P2002':
        message = '该编码已存在，请使用其他编码';
        status = HttpStatus.CONFLICT;
        break;
      case 'P2003': {
        const field = (exception.meta as any)?.field_name || '';
        // Extract meaningful name: "Material_categoryId_fkey" → "categoryId"
        const parts = field.split('_');
        const relation = parts.length > 1 ? parts[parts.length - 2] : (field || '关联数据');
        message = `关联数据约束失败：${relation} 不合法或存在引用`;
        status = HttpStatus.CONFLICT;
        break;
      }
      case 'P2025':
        message = '记录未找到，可能已被删除';
        status = HttpStatus.NOT_FOUND;
        break;
    }

    response.status(status).json({ statusCode: status, message, error: exception.code });
  }
}
