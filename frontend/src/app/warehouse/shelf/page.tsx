'use client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Plus, Search } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpEmpty, ErpTools, ErpPagination } from '@/components/ui/erp-table';
export default function Page() {
  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border"><div className="flex items-center gap-1"><Button variant="secondary" size="sm"><Plus className="h-3.5 w-3.5"/>新增</Button><Button variant="outline" size="sm">修改</Button><Button variant="outline" size="sm">删除</Button><Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1"/>导出</Button></div><div className="flex items-center gap-1"><Button variant="ghost" size="sm">重置</Button><Button variant="default" size="sm"><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button></div></div>
    <ErpTools/><div className="overflow-auto"><ErpTable><ErpThead><ErpTh>编码</ErpTh><ErpTh>名称</ErpTh><ErpTh>状态</ErpTh><ErpTh>创建时间</ErpTh></ErpThead><ErpTbody><ErpEmpty colSpan={4}/></ErpTbody></ErpTable></div>
    <ErpPagination page={1} pageSize={30} total={0} onPage={()=>{}} onPageSize={()=>{}}/>
  </div></TooltipProvider>);
}
