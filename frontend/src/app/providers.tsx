'use client';
import { AuthProvider } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/main-layout';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MainLayout>{children}</MainLayout>
    </AuthProvider>
  );
}
