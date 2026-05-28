'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-canvas">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl">⚠</div>
            <h1 className="text-xl font-bold text-foreground">页面发生异常</h1>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.state.error?.message || '未知错误'}
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              重新加载
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
