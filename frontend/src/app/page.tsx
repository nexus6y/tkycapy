'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ===== Calendar ===== */
function Calendar() {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date());

  const cells: { day: number; type: 'prev' | 'current' | 'next'; date: Date }[] = [];
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, type: 'prev', date: new Date(year, month - 1, daysInPrev - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, type: 'current', date: new Date(year, month, d) });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, type: 'next', date: new Date(year, month + 1, d) });
  }

  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();

  const rows = Array.from({ length: 6 }, (_, r) => cells.slice(r * 7, r * 7 + 7));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-foreground">{year} 年 {month + 1} 月</span>
        <div className="flex items-center gap-0.5 ml-auto">
          <button onClick={prevMonth} className="px-1.5 py-0.5 text-xs border border-border rounded hover:bg-muted transition-colors">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button onClick={goToday} className="px-2 py-0.5 text-xs border border-border rounded hover:bg-muted transition-colors">今天</button>
          <button onClick={nextMonth} className="px-1.5 py-0.5 text-xs border border-border rounded hover:bg-muted transition-colors">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
      <table className="w-full border-collapse text-center">
        <thead>
          <tr>
            {weekDays.map(d => (
              <th key={d} className="text-xs font-medium text-muted-foreground py-1.5 w-[14.28%]">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((c, ci) => (
                <td key={ci} className={`text-xs py-1.5 cursor-default
                  ${c.type !== 'current' ? 'text-muted-foreground/30' : 'text-foreground'}
                  ${isToday(c.date) ? 'relative' : ''}
                `}>
                  {isToday(c.date) ? (
                    <span className="relative z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#409eff] text-white font-medium">{c.day}</span>
                  ) : c.day}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ===== Dashboard ===== */
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ pending: 0, mySubmissions: 0, reviewed: 0, inventoryItems:0, inventoryQty:0, inboundApproved:0, outboundApproved:0, costEntries:0 });

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    fetchStats();
  }, [loading, user, router, fetchStats]);

  if (loading) return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">加载中...</div>;
  if (!user) return null;

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left column */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Welcome + Stats */}
        <div className="bg-background rounded-lg border border-border p-5 shrink-0">
          <h3 className="text-base font-medium text-foreground mb-4">你好，{user.name}，欢迎回来！</h3>
          <div className="flex gap-4 flex-wrap">
            {[
              { label: '待审核', value: stats.pending, color: 'text-[#e6a23c]', bg: 'bg-[#fdf6ec]' },
              { label: '我的发起', value: stats.mySubmissions, color: 'text-[#409eff]', bg: 'bg-[#ecf5ff]' },
              { label: '已审核', value: stats.reviewed, color: 'text-[#67c23a]', bg: 'bg-[#f0f9eb]' },
              { label: '库存品种', value: stats.inventoryItems, color: 'text-[#909399]', bg: 'bg-[#f4f4f5]' },
              { label: '入库单(已审)', value: stats.inboundApproved, color: 'text-[#67c23a]', bg: 'bg-[#f0f9eb]' },
              { label: '出库单(已审)', value: stats.outboundApproved, color: 'text-[#e6a23c]', bg: 'bg-[#fdf6ec]' },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-3 ${s.bg} rounded-lg px-5 py-4 flex-1`}>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className={`text-[28px] font-bold ${s.color} leading-none`}>
                    {s.value}<span className="text-sm font-normal ml-1">个</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-background rounded-lg border border-border p-5 flex-1">
          <Calendar />
        </div>
      </div>

      {/* Right column */}
      <div className="w-[320px] shrink-0 flex flex-col gap-4">
        {/* Quick links */}
        <div className="bg-background rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">常用功能</span>
          </div>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            暂无常用功能
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-background rounded-lg border border-border p-5 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">通知消息</span>
            <button className="text-xs text-[#409eff] hover:underline">查看更多</button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
            <span className="text-3xl opacity-30">📭</span>
            <span>暂无信息</span>
          </div>
        </div>

        {/* Help */}
        <div className="bg-background rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">操作帮助</span>
          </div>
          <div className="mb-3">
            <span className="text-xs text-muted-foreground">视频教程</span>
            <div className="flex items-center justify-center py-5 bg-muted/30 rounded mt-1 cursor-pointer hover:bg-muted/50 transition-colors">
              <span className="text-2xl">▶️</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">技术支持</span>
            <div className="flex items-center gap-2 mt-1 text-sm">
              <span className="text-muted-foreground">叶春生：15521504341</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
