'use client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpEmpty, ErpTools, ErpPagination } from '@/components/ui/erp-table';
export default function Page() {
  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border"><div><Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1"/>导出</Button></div><div className="flex items-center gap-1"><Button variant="ghost" size="sm">重置</Button><Button variant="default" size="sm"><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button></div></div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30"><span className="text-[13px] text-muted-foreground">编码</span><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"/></div>
    <ErpTools/><div className="overflow-auto"><ErpTable><ErpThead><ErpTh>编号</ErpTh><ErpTh>名称</ErpTh><ErpTh>状态</ErpTh><ErpTh>创建时间</ErpTh></ErpThead><ErpTbody><ErpEmpty colSpan={4}/></ErpTbody></ErpTable></div>
    <ErpPagination page={1} pageSize={30} total={0} onPage={()=>{}} onPageSize={()=>{}}/>
  </div></TooltipProvider>);
}
