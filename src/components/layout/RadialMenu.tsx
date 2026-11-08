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
  BookMarked,
  User
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

interface DesktopAppItem {
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

// Full Apps List for PC & Tablet View
const allDesktopApps: DesktopAppItem[] = [
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

const liquidEase = [0.25, 0.8, 0.25, 1];

export function RadialMenu() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [latestPost, setLatestPost] = useState<Post | null>(null);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  
  // User Permission Flags
  const canAdmin = appUser?.isAdmin || appUser?.isStoreAdmin;

  // Filter Apps according to permissions
  const visibleApps = canAdmin 
    ? allDesktopApps 
    : allDesktopApps.filter(app => app.allStaff);

  // Split visible apps into Left Wing and Right Wing for central logo branching animation
  const halfLength = Math.ceil(visibleApps.length / 2);
  const leftApps = visibleApps.slice(0, halfLength);
  const rightApps = visibleApps.slice(halfLength);

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
        console.error("Failed to fetch latest post for desktop home:", err);
      }
    }
    fetchLatest();

    // Freeze motion 1 second after the entrance animation completes (around 1.8s total)
    const freezeTimer = setTimeout(() => {
      setIsFrozen(true);
    }, 1800);

    return () => clearTimeout(freezeTimer);
  }, [appUser]);

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

  const handleAppClick = (e: React.MouseEvent, app: DesktopAppItem) => {
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
    <div className="relative flex flex-col min-h-screen bg-[#FAF7F2] text-slate-800 pb-16 select-none overflow-hidden">
      
      {/* Background Water Wave Glow & Ambient Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cf2e2e_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      {/* Top Header User Info & Logout Button */}
      <header className="relative z-50 w-full max-w-7xl mx-auto px-8 pt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white/90 backdrop-blur-md border border-orange-100 px-4 py-2 rounded-full shadow-sm">
          <User className="h-4 w-4 text-[#cf2e2e]" />
          <span>{appUser?.department || 'ログイン中'}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-100/80 hover:bg-rose-100 text-slate-700 hover:text-rose-600 transition-all shadow-sm text-sm font-bold"
        >
          <LogOut className="h-4 w-4" />
          <span>ログアウト</span>
        </button>
      </header>

      {/* Central Flow Stage: Center Logo + Left & Right Branching App Wings */}
      <main className="relative z-40 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
        
        {/* Main Stage Grid Container: md:flex-row to arrange logo in center and left/right wings horizontally on tablet */}
        <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-4 lg:gap-6 xl:gap-8 my-auto">
          
          {/* LEFT WING (2 columns x 3 rows) */}
          <div className="flex-1 w-full flex items-center justify-center md:justify-end">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-3 lg:gap-4">
              {leftApps.map((app, index) => {
                return (
                  <motion.div
                    key={app.id}
                    initial={{ x: 120, opacity: 0, scale: 0.2 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 45,
                      damping: 15,
                      mass: 1.2,
                      delay: 0.6 + index * 0.1
                    }}
                    onMouseEnter={() => setHoveredApp(app.id)}
                    onMouseLeave={() => setHoveredApp(null)}
                    className="transform-gpu flex justify-center"
                  >
                    <Link 
                      href={app.href}
                      onClick={(e) => handleAppClick(e, app)}
                      className="group relative flex flex-col items-center outline-none"
                    >
                      <motion.div
                        animate={{ y: isFrozen ? 0 : [0, -6, 0] }}
                        transition={
                          isFrozen 
                            ? { duration: 0.4, ease: "easeOut" }
                            : { duration: 1.2, ease: "easeInOut" }
                        }
                        className="flex flex-col items-center"
                      >
                        {/* 2 columns x 3 rows Icon Card */}
                        <motion.div 
                          className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-white border border-orange-100/90 shadow-sm group-hover:shadow-xl group-hover:border-orange-300 transition-all w-24 h-28 sm:w-26 sm:h-30 md:w-26 md:h-30 lg:w-28 lg:h-32 xl:w-32 xl:h-36"
                          whileHover={{ scale: 1.08 }}
                          transition={{ type: "spring", stiffness: 140, damping: 14 }}
                        >
                          <div className="h-9 w-9 sm:h-11 sm:w-11 md:h-11 md:w-11 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center mb-1 overflow-hidden shadow-sm border border-orange-100/60 bg-white p-1">
                            {app.image ? (
                              <img 
                                src={encodeURI(app.image)} 
                                alt={app.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className={`h-full w-full bg-gradient-to-br ${app.color} flex items-center justify-center text-white rounded-lg shadow-inner`}>
                                <app.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-800 leading-tight truncate w-full text-center">{app.name}</span>
                          <span className="text-[10px] text-slate-500 leading-tight truncate w-full mt-0.5 font-medium text-center">{app.subName}</span>
                        </motion.div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* CENTER CORE: Logo & Menu Bar */}
          <div className="flex flex-col items-center justify-center my-2 md:my-0 z-50 shrink-0">
            
            {/* Pure White Blur Glow Backlight Aura */}
            <motion.div 
              className="absolute h-48 w-48 sm:h-64 sm:w-64 md:h-72 md:w-72 lg:h-80 lg:w-80 xl:h-[380px] xl:w-[380px] rounded-full bg-gradient-to-r from-white via-amber-50/80 to-white blur-3xl opacity-90 pointer-events-none transform-gpu"
              animate={{ scale: isFrozen ? 1 : [0.95, 1.08, 0.95], opacity: isFrozen ? 0.85 : [0.7, 0.95, 0.7] }}
              transition={isFrozen ? { duration: 0.5 } : { duration: 3, ease: "easeInOut" }}
            />

            {/* Original Prominent Center Logo */}
            <motion.div 
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: isFrozen ? 0 : [0, -8, 0]
              }}
              transition={{ 
                scale: { type: "spring", stiffness: 50, damping: 14, mass: 1.2 },
                opacity: { duration: 0.9, ease: liquidEase },
                y: isFrozen ? { duration: 0.4, ease: "easeOut" } : { duration: 1.2, ease: "easeInOut" }
              }}
              whileHover={{ scale: 1.06 }}
              className="relative h-32 sm:h-40 md:h-48 lg:h-52 xl:h-56 w-72 sm:w-96 md:w-[416px] lg:w-[468px] xl:w-[494px] flex items-center justify-center filter drop-shadow-[0_0_35px_rgba(255,255,255,0.95)] drop-shadow-[0_10px_25px_rgba(255,255,255,0.8)] transform-gpu cursor-pointer px-2"
            >
              <img 
                src="/S-Compass ①.png" 
                alt="S-Compass Logo" 
                className="w-full h-full object-contain"
              />
            </motion.div>

            {/* Menu Bar directly below the Center Logo (Non-clipping 2-Row Layout) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: liquidEase, delay: 0.3 }}
              className="w-full max-w-[280px] sm:max-w-xs md:max-w-sm mt-3 sm:mt-4 px-2"
            >
              <nav className="flex flex-col gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-xl border border-orange-100 rounded-2xl p-2 sm:p-2.5 shadow-lg">
                {/* Row 1 */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <a href="/" className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 text-[#cf2e2e] font-bold text-xs sm:text-sm hover:opacity-80 transition-opacity whitespace-nowrap">
                    <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="whitespace-nowrap">1. ホーム</span>
                  </a>

                  {canAdmin && (
                    <a href="/posts/new" className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 text-slate-700 hover:text-slate-900 transition-colors text-xs sm:text-sm font-semibold whitespace-nowrap">
                      <PenSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                      <span className="whitespace-nowrap">2. 新規投稿</span>
                    </a>
                  )}

                  <a href="/past-posts" className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 text-slate-700 hover:text-slate-900 transition-colors text-xs sm:text-sm font-semibold whitespace-nowrap">
                    <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500 shrink-0" />
                    <span className="whitespace-nowrap">3. 連絡一覧</span>
                  </a>
                </div>

                {/* Row 2 */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-1 border-t border-orange-100/60">
                  <a href="/manual" className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 text-slate-700 hover:text-slate-900 transition-colors text-xs sm:text-sm font-semibold whitespace-nowrap">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
                    <span className="whitespace-nowrap">4. マニュアル</span>
                  </a>

                  {canAdmin && (
                    <a href="/admin/dashboard" className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 text-slate-700 hover:text-slate-900 transition-colors text-xs sm:text-sm font-semibold whitespace-nowrap">
                      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-700 shrink-0" />
                      <span className="whitespace-nowrap">5. 管理者</span>
                    </a>
                  )}
                </div>
              </nav>
            </motion.div>

          </div>

          {/* RIGHT WING (2 columns x 3 rows) */}
          <div className="flex-1 w-full flex items-center justify-center md:justify-start">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-3 lg:gap-4">
              {rightApps.map((app, index) => {
                return (
                  <motion.div
                    key={app.id}
                    initial={{ x: -120, opacity: 0, scale: 0.2 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 45,
                      damping: 15,
                      mass: 1.2,
                      delay: 0.6 + index * 0.1
                    }}
                    onMouseEnter={() => setHoveredApp(app.id)}
                    onMouseLeave={() => setHoveredApp(null)}
                    className="transform-gpu flex justify-center"
                  >
                    <Link 
                      href={app.href}
                      onClick={(e) => handleAppClick(e, app)}
                      className="group relative flex flex-col items-center outline-none"
                    >
                      <motion.div
                        animate={{ y: isFrozen ? 0 : [0, -6, 0] }}
                        transition={
                          isFrozen 
                            ? { duration: 0.4, ease: "easeOut" }
                            : { duration: 1.2, ease: "easeInOut" }
                        }
                        className="flex flex-col items-center"
                      >
                        {/* 2 columns x 3 rows Icon Card */}
                        <motion.div 
                          className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-white border border-orange-100/90 shadow-sm group-hover:shadow-xl group-hover:border-orange-300 transition-all w-24 h-28 sm:w-26 sm:h-30 md:w-26 md:h-30 lg:w-28 lg:h-32 xl:w-32 xl:h-36"
                          whileHover={{ scale: 1.08 }}
                          transition={{ type: "spring", stiffness: 140, damping: 14 }}
                        >
                          <div className="h-9 w-9 sm:h-11 sm:w-11 md:h-11 md:w-11 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center mb-1 overflow-hidden shadow-sm border border-orange-100/60 bg-white p-1">
                            {app.image ? (
                              <img 
                                src={encodeURI(app.image)} 
                                alt={app.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className={`h-full w-full bg-gradient-to-br ${app.color} flex items-center justify-center text-white rounded-lg shadow-inner`}>
                                <app.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-800 leading-tight truncate w-full text-center">{app.name}</span>
                          <span className="text-[10px] text-slate-500 leading-tight truncate w-full mt-0.5 font-medium text-center">{app.subName}</span>
                        </motion.div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

        {/* New Message POPUP / Banner (Centered Bottom Stage) */}
        <section className="w-full max-w-xl mx-auto mt-8">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-xs font-bold tracking-wider text-rose-600 uppercase flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> 新着メッセージ
            </span>
            <Link href="/past-posts" className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-0.5">
              すべて見る <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {latestPost ? (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="relative overflow-hidden rounded-2xl bg-white border border-rose-200/80 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-100/80 to-amber-50/20 rounded-full blur-xl pointer-events-none" />
              <Link href={`/posts/${latestPost.id}`} className="block space-y-1.5 relative z-10">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-[10px]">
                    {latestPost.category || 'お知らせ'}
                  </span>
                  <span className="text-slate-500 text-xs">{format(latestPost.createdAt, 'M/d HH:mm', { locale: ja })}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                  {latestPost.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-1 leading-relaxed">
                  {latestPost.body}
                </p>
              </Link>
            </motion.div>
          ) : (
            <div className="rounded-2xl bg-white border border-orange-100 p-3.5 text-center text-xs text-slate-500 shadow-sm">
              新着メッセージはありません
            </div>
          )}
        </section>

      </main>

      {/* Store Selection Dialog for HQ Admins */}
      <StoreSelectDialog 
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        title={dialogState.title}
        options={dialogState.options}
      />
    </div>
  );
}
