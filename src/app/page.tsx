"use client";

import { RadialMenu } from '@/components/layout/RadialMenu';
import { MobileHome } from '@/components/layout/MobileHome';
import { useAuth } from './auth/AuthProvider';
import { Loader2 } from 'lucide-react';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !appUser) {
      router.replace('/auth/login');
    }
  }, [loading, appUser, router]);

  if (loading || !appUser) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#cf2e2e]" />
        <p className="mt-3 text-xs font-bold text-slate-600">読み込んでいます...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Tablet & PC View (Fluid Radial Menu) */}
      <div className="hidden md:block">
        <RadialMenu />
      </div>

      {/* Smartphone View (Mobile Bottom Nav + Deli Apps + Popup) */}
      <div className="block md:hidden">
        <MobileHome />
      </div>
    </div>
  );
}
