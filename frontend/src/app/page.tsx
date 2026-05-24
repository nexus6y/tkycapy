'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  if (loading) return <div className="flex items-center justify-center h-full">加载中...</div>;
  if (!user) return null;

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-1">你好，{user.name}，欢迎回来！</h2>
        <p className="text-gray-500 text-sm">系统已就绪，请通过左侧菜单导航到各功能页面。</p>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">2</div>
            <div className="text-sm text-gray-500 mt-1">待审核</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">2</div>
            <div className="text-sm text-gray-500 mt-1">我的发起</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">0</div>
            <div className="text-sm text-gray-500 mt-1">已审核</div>
          </div>
        </div>
      </div>
    </div>
  );
}
