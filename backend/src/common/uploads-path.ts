import { join } from 'path';

export function getUploadsDir(...segments: string[]) {
  const baseDir = process.env.VERCEL ? '/tmp/uploads' : join(process.cwd(), 'uploads');
  return join(baseDir, ...segments);
}
