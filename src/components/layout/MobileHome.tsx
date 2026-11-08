"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, 
  PenSquare, 
  List, 
  BookOpen, 
  Settings, 
  ChevronRight,
  Sparkles,
  CalendarDays,
  Tag,
  FileText,
  Layers,
  HelpCircle,
  ShoppingCart,
  Activity,
  ClipboardCheck,
  LogOut,
  Video,
  BookMarked
} from 'lucide-react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { db } from '@/lib/firebase';
import type { Post } from '@/lib/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '@/app/auth/AuthProvider';
import { getStoreTargetUrl, LinkCategory, StoreLinkOption } from '@/lib/sso';
import { StoreSelectDialog } from '@/components/common/StoreSelectDialog';
import { canUserSeePost } from '@/lib/utils';

interface MobileAppItem {
  id: string;
  name: string;
  subName: string;
  image: string | null;
  icon: React.ElementType;
  color: string;
  href: string;
  category?: LinkCategory;
  allStaff?: boolean;
}

// Full Apps List for Smartphone Home
const allMobileApps: MobileAppItem[] = [
  { id: 'deli-count', name: 'Deli・count', subName: '値引き・廃棄', image: '/deli・count.jpg', icon: Tag, color: 'from-purple-500 to-indigo-600', href: '#', category: 'discount' },
  { id: 'deli-base', name: 'Deli・base', subName: 'レシピ', image: '/deli・base.jpg', icon: CalendarDays, color: 'from-cyan-500 to-blue-600', href: '#' },
  { id: 'deli-supporter', name: 'Deli・supporter', subName: '製造計画', image: '/deli・supporter.jpg', icon: HelpCircle, color: 'from-amber-500 to-orange-600', href: 'https://firebase-portfolio-maestro--fir-01278470-c0ea3.us-central1.hosted.app/login' },
  { id: 'deli-log', name: 'Deli・㏒', subName: '日報', image: '/deli・rog.jpg', icon: FileText, color: 'from-emerald-500 to-teal-600', href: '#' },
  { id: 'deli-space', name: 'Deli・space', subName: 'シフト作成・提出', image: '/deli・space.jpg', icon: Layers, color: 'from-pink-500 to-rose-600', href: '#', category: 'shift', allStaff: true },
  { id: 'order', name: '発注', subName: '発注入力', image: null, icon: ShoppingCart, color: 'from-orange-500 to-amber-600', href: 'https://www.infomart.co.jp/scripts/logon.asp' },
  { id: 'health', name: '健康管理', subName: '健康管理', image: null, icon: Activity, color: 'from-rose-500 to-red-600', href: '#', category: 'health', allStaff: true },
  { id: 'haccp', name: 'HACCP管理表', subName: '衛生管理', image: null, icon: ClipboardCheck, color: 'from-indigo-500 to-purple-600', href: '#' },
  { id: 'philosophy-video', name: 'シンノオ理念動画', subName: '企業理念・動画', image: null, icon: Video, color: 'from-rose-500 to-pink-600', href: 'https://www.youtube.com/playlist?list=PLiFXvBEjd84paVg4OzobLQobpYcny2C5T', allStaff: true },
  { id: 'shinnoo-book', name: 'シンノオブック', subName: '行動指針・クレド', image: null, icon: BookMarked, color: 'from-blue-500 to-indigo-600', href: '/shinnoo-book', allStaff: true },
];

export function MobileHome() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [latestPost, setLatestPost] = useState<Post | null>(null);
  
  // User Permission Flags
  const canAdmin = appUser?.isAdmin || appUser?.isStoreAdmin;

  // Filter Apps: Admins see all 10 apps, Regular Staff see ONLY 4 allStaff apps (Health, Shift, Video, Book)
  const visibleMobileApps = canAdmin 
    ? allMobileApps 
    : allMobileApps.filter(app => app.allStaff);

  // Store Selection Dialog State
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    options: readonly StoreLinkOption[];
  }>({
    isOpen: false,
    title: '',
    options: [],
  });

  useEffect(() => {
    async function fetchLatest() {
      if (!appUser) return;
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'), limit(20));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const posts = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          } as Post));

          const visiblePost = posts.find(post => canUserSeePost(post, appUser));
          if (visiblePost) {
            setLatestPost(visiblePost);
          } else {
            setLatestPost(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest post for mobile home:", err);
      }
    }
    fetchLatest();
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (err) {
      console.error("Failed to sign out:", err);
    } finally {
      window.location.replace('/auth/login');
    }
  };

  const handleAppClick = (e: React.MouseEvent, app: MobileAppItem) => {
    if (app.category) {
      e.preventDefault();
      const result = getStoreTargetUrl(app.category, appUser?.department, appUser?.isAdmin);

      if (result.requiresStoreSelect) {
        setDialogState({
          isOpen: true,
          title: app.name,
          options: result.options,
        });
      } else if (result.url) {
        window.open(result.url, '_blank');
      }
    } else if (app.href.startsWith('http') || app.href.endsWith('.pdf')) {
      e.preventDefault();
      window.open(app.href, '_blank');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] text-slate-800 pb-24 select-none">
      
      {/* 1. Top Header with Bulletproof Logo Display */}
      <header className="sticky top-0 z-40 flex items-center justify-between py-3 px-4 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-orange-100/80 shadow-sm">
        <div className="w-8" />
        
        {/* Logo Container */}
        <div className="flex items-center justify-center">
          <img 
            src="/S-Compass ①.png" 
            alt="S-Compass Logo" 
            className={canAdmin ? "h-18 sm:h-20 w-auto object-contain" : "h-26 sm:h-32 w-auto object-contain"}
          />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="ログアウト"
          className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-orange-100/60 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-[9px] font-bold mt-0.5">ログアウト</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 space-y-3.5 max-w-md mx-auto w-full">
        
        {/* 2. New Message POPUP / Banner */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[11px] font-bold tracking-wider text-rose-600 uppercase flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> 新着メッセージ
            </span>
            <Link href="/past-posts" className="text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-0.5">
              すべて見る <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {latestPost ? (
            <motion.div 
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-xl bg-white border border-rose-200/80 p-3 shadow-sm"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rose-100/80 to-amber-50/20 rounded-full blur-xl pointer-events-none" />
              <Link href={`/posts/${latestPost.id}`} className="block space-y-1 relative z-10">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-[9px]">
                    {latestPost.category || 'お知らせ'}
                  </span>
                  <span className="text-slate-500">{format(latestPost.createdAt, 'M/d HH:mm', { locale: ja })}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                  {latestPost.title}
                </h3>
                <p className="text-[11px] text-slate-600 line-clamp-1 leading-relaxed">
                  {latestPost.body}
                </p>
              </Link>
            </motion.div>
          ) : (
            <div className="rounded-xl bg-white border border-orange-100 p-2.5 text-center text-[11px] text-slate-500 shadow-sm">
              新着メッセージはありません
            </div>
          )}
        </section>

        {/* 3. App Icons Section */}
        <section className="w-full space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              機能一覧
            </h2>
            <span className="text-[9px] text-slate-400">タップで起動</span>
          </div>

          <div className={`grid gap-2.5 ${canAdmin ? 'grid-cols-3' : 'grid-cols-2 max-w-xs mx-auto'}`}>
            {visibleMobileApps.map((app) => (
              <motion.div key={app.id} whileTap={{ scale: 0.94 }}>
                <Link 
                  href={app.href}
                  onClick={(e) => handleAppClick(e, app)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-orange-100/80 hover:border-orange-200 shadow-sm hover:shadow text-center group transition-all h-full min-h-[104px]"
                >
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-1.5 overflow-hidden shadow-sm group-hover:scale-105 transition-transform border border-orange-100/60 bg-white p-0.5">
                    {app.image ? (
                      <img 
                        src={encodeURI(app.image)} 
                        alt={app.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${app.color} flex items-center justify-center text-white rounded-lg`}>
                        <app.icon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 leading-snug break-words w-full px-0.5">{app.name}</span>
                  <span className="text-[9px] text-slate-500 leading-snug break-words w-full mt-0.5 font-medium px-0.5">{app.subName}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Store Selection Dialog for HQ Admins */}
      <StoreSelectDialog 
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        title={dialogState.title}
        options={dialogState.options}
      />

      {/* 4. Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-orange-100/90 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          <a href="/" className="flex flex-col items-center gap-0.5 px-3 py-1 text-[#cf2e2e] font-bold">
            <Home className="h-5 w-5" />
            <span className="text-[10px]">ホーム</span>
          </a>

          {canAdmin && (
            <a href="/posts/new" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-500 hover:text-slate-900 transition-colors">
              <PenSquare className="h-5 w-5" />
              <span className="text-[10px]">新規投稿</span>
            </a>
          )}

          <a href="/past-posts" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-500 hover:text-slate-900 transition-colors">
            <List className="h-5 w-5" />
            <span className="text-[10px]">連絡一覧</span>
          </a>

          <a href="/manual" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-500 hover:text-slate-900 transition-colors">
            <BookOpen className="h-5 w-5" />
            <span className="text-[10px]">マニュアル</span>
          </a>

          {canAdmin && (
            <a href="/admin/dashboard" className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-500 hover:text-slate-900 transition-colors">
              <Settings className="h-5 w-5" />
              <span className="text-[10px]">管理者</span>
            </a>
          )}

        </div>
      </nav>
    </div>
  );
}
