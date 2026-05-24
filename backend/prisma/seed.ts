import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { code: 'default' },
    update: {},
    create: { code: 'default', name: '默认租户' },
  });

  const role = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'admin' } },
    update: {},
    create: { tenantId: tenant.id, code: 'admin', name: '管理员' },
  });

  const hashed = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashed,
      name: '系统管理员',
      tenantId: tenant.id,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  console.log('Seed completed');
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => pool.end()));
