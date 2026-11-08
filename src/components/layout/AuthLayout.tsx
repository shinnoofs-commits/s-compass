import { Logo } from '@/components/common/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {children}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4">
        &copy; {new Date().getFullYear()} S-Compass. All rights reserved.
      </p>
    </div>
  );
}
