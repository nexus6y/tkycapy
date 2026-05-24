'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">生产制造管家</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.name} ({user.username})</span>
          <Button variant="outline" size="sm" onClick={logout}>退出登录</Button>
        </div>
      </header>
      <main className="p-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">你好，{user.name}，欢迎回来！</h2>
          <p className="text-gray-500">系统已就绪，等待模块开发...</p>
        </div>
      </main>
    </div>
  );
}
