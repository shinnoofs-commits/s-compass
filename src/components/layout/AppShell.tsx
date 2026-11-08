
"use client";

import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Bell,
  UserCircle,
  LogOut,
  Shield,
  ArchiveIcon,
  FilePlus2,
  Edit3,
  HelpCircle,
  ServerCrash,
  Link as LinkIcon,
  ExternalLink,
  Presentation,
  BookUser,
  FileCode2,
  HeartPulse,
  MessageCircle,
  FileText,
  ShoppingCart,
  ChevronDown,
  History,
  ClipboardCheck,
  BarChart3,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Logo } from '@/components/common/Logo';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuSubTrigger,
  SidebarMenuSubContent,
} from "@/components/ui/sidebar";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/auth/AuthProvider';
import { getAuth, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SystemSettings } from '@/lib/types';
import { SHIFT_SUBMISSION_LINKS, HEALTH_MANAGEMENT_LINKS, HACCP_MANAGEMENT_LINKS, ADMIN_DEPARTMENTS } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';

interface AppShellProps {
  children: React.ReactNode;
}

function MaintenancePage() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Card className="w-full max-w-md m-4 text-center shadow-2xl">
                <CardHeader>
                    <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
                    <CardTitle className="text-2xl">メンテナンス中</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        現在、システムはメンテナンス中です。ご迷惑をおかけしますが、しばらくお待ちください。
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

function LoadingScreen() {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p>アプリケーションを読み込んでいます...</p>
      </div>
    );
}

/**
 * 関連リンク用ボタンコンポーネント
 */
const RelatedLinkButton = ({ href, tooltip, label, icon: Icon, isVisible }: { href: string; tooltip: string; label: string; icon: React.ElementType, isVisible: boolean }) => {
    const pathname = usePathname();

    if (!isVisible) return null;

    const isExternal = href.startsWith('http');
    const commonProps = {
        tooltip: tooltip,
        isActive: pathname.startsWith(href),
    };

    return (
        <SidebarMenuButton {...commonProps} asChild>
            <a 
                href={href} 
                target={isExternal ? "_blank" : "_self"} 
            >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
            </a>
        </SidebarMenuButton>
    );
};


export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { appUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const auth = getAuth();
  
  const [systemStatus, setSystemStatus] = useState<SystemSettings['status'] | null>(null);
  const [isSystemLoading, setIsSystemLoading] = useState(true);
  
  const isAuthenticated = !!appUser;
  const isAdmin = appUser?.isAdmin ?? false;
  const isStoreAdmin = appUser?.isStoreAdmin ?? false;

  useEffect(() => {
    const configRef = doc(db, 'config', 'runtime-limits');
    const unsubscribeSystem = onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
            const isEnabled = docSnap.data().writes_enabled;
            setSystemStatus(isEnabled === false ? 'maintenance' : 'running');
        } else {
            setSystemStatus('running');
        }
        setIsSystemLoading(false);
    }, (error) => {
        console.error("Firestore snapshot error on config/runtime-limits:", error);
        setSystemStatus('running');
        setIsSystemLoading(false);
    });

    return () => {
      unsubscribeSystem();
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      toast({ title: "ログアウトしました" });
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "ログアウトエラー", description: "ログアウトに失敗しました。", variant: "destructive" });
    } finally {
      window.location.replace('/auth/login');
    }
  }, [auth, toast]);

 useEffect(() => {
    if (authLoading || isSystemLoading) {
      return;
    }

    const isAuthPage = pathname.startsWith('/auth/');
    const isPublicPage = ['/presentation', '/manual', '/specification'].includes(pathname);
    const isAdminPage = pathname.startsWith('/admin/');

    if (systemStatus === 'maintenance' && !isAdmin && !isPublicPage && !isAuthPage) {
      return;
    }
    
    if (!isAuthenticated && !isAuthPage && !isPublicPage) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated && isAdminPage && !isAdmin) {
      toast({
        title: "アクセス権限がありません",
        description: "管理者ページへのアクセスは許可されていません。",
        variant: "destructive"
      });
      router.push('/');
      return;
    }
  }, [authLoading, isSystemLoading, systemStatus, isAuthenticated, pathname, isAdmin, router, toast]);


  if (authLoading || isSystemLoading) {
    return <LoadingScreen />;
  }

  const isUnderMaintenance = systemStatus === 'maintenance' && !isAdmin;
  const isAuthOrPublicPage = pathname.startsWith('/auth/') || ['/presentation', '/manual', '/specification'].includes(pathname);
  if (isUnderMaintenance && !isAuthOrPublicPage && !pathname.startsWith('/admin/')) {
    return <MaintenancePage />;
  }
  
  return <main className="min-h-screen bg-[#FAF7F2] flex-1">{children}</main>;

  const userDept = appUser?.department;

  // Helper to render dropdown or direct link
  const renderStoreRelLink = (label: string, icon: React.ElementType, links: readonly {name: string, url: string}[]) => {
    if (userDept && ADMIN_DEPARTMENTS.includes(userDept as any)) {
      return (
        <SidebarMenuItem>
          <SidebarMenuSub>
            <SidebarMenuSubTrigger>
              {React.createElement(icon, { className: "h-5 w-5" })}
              <span>{label}</span>
            </SidebarMenuSubTrigger>
            <SidebarMenuSubContent>
              {links.map(link => (
                <SidebarMenuSubItem key={link.name}>
                  <SidebarMenuSubButton asChild>
                    <a 
                      href={link.url} 
                      target="_blank" 
                    >
                      {link.name}
                    </a>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSubContent>
          </SidebarMenuSub>
        </SidebarMenuItem>
      );
    }

    const storeLink = links.find(l => l.name === userDept)?.url;
    if (!storeLink || storeLink === '#') return null;

    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={label}>
          <a 
            href={storeLink} 
            target="_blank" 
          >
            {React.createElement(icon, { className: "h-5 w-5" })}
            <span>{label}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };
  
  return (
    <>
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
        <SidebarHeader className="p-4">
          <Logo />
        </SidebarHeader>
        <SidebarContent className="p-2 flex-grow">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="ホーム" isActive={pathname === '/'}>
                <Link href="/"><Home /><span>ホーム</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="過去の投稿" isActive={pathname === '/past-posts'}>
                <Link href="/past-posts"><History /><span>過去の投稿</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {(isAdmin) && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="新規投稿" isActive={pathname === '/posts/new'}>
                <Link href="/posts/new"><FilePlus2 /><span>新規投稿</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="通知" isActive={pathname === '/notifications'}>
                <Link href="/notifications"><Bell /><span>通知</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {(isAdmin) && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="下書き・予約" isActive={pathname === '/me/drafts'}>
                <Link href="/me/drafts"><Edit3 /><span>下書き・予約</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="アーカイブ" isActive={pathname === '/archive'}>
                <Link href="/archive"><ArchiveIcon /><span>アーカイブ</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarGroup>
                <SidebarGroupLabel className="mt-4">関連リンク</SidebarGroupLabel>
                <SidebarMenuItem>
                    <RelatedLinkButton href="/manual" tooltip="操作マニュアル" label="操作マニュアル" icon={BookUser} isVisible={true} />
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <RelatedLinkButton href="/presentation" tooltip="ご提案資料" label="ご提案資料" icon={Presentation} isVisible={isAdmin} />
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <RelatedLinkButton href="/specification" tooltip="システム仕様書" label="システム仕様書" icon={FileCode2} isVisible={isAdmin} />
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="発注マニュアル">
                        <a 
                            href="https://v0-order-schedule-management.vercel.app/" 
                            target="_blank" 
                        >
                            <FileText className="h-5 w-5" />
                            <span>発注マニュアル</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="発注">
                        <a 
                            href="https://www.infomart.co.jp/scripts/logon.asp" 
                            target="_blank" 
                        >
                            <ShoppingCart className="h-5 w-5" />
                            <span>発注</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                
                {renderStoreRelLink("シフト提出", HeartPulse, SHIFT_SUBMISSION_LINKS)}
                {renderStoreRelLink("健康管理", HeartPulse, HEALTH_MANAGEMENT_LINKS)}
                {renderStoreRelLink("HACCP管理表", ClipboardCheck, HACCP_MANAGEMENT_LINKS)}

                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="廃棄管理アプリ">
                        <a 
                            href="https://studio--ver41-13613744-4a01f.us-central1.hosted.app" 
                            target="_blank" 
                        >
                            <Trash2 className="h-5 w-5" />
                            <span>廃棄管理アプリ</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>

            </SidebarGroup>
            
            {isAdmin && !isStoreAdmin && ( 
              <SidebarGroup>
                 <SidebarGroupLabel className="mt-4">管理者メニュー</SidebarGroupLabel>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="ダッシュボード" isActive={pathname.startsWith('/admin')}>
                        <Link href="/admin/dashboard">
                            <Shield />
                            <span>管理者メニュー</span>
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
              </SidebarGroup>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          {isAuthenticated && appUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
                  <UserAvatar src={appUser.iconUrl ?? undefined} name={appUser.name} size="sm" data-ai-hint="avatar person"/>
                  <div className="text-left group-data-[collapsible=icon]:hidden">
                    <p className="font-medium text-sm">{appUser.name}</p>
                    <p className="text-xs text-muted-foreground">{appUser.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/me/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>プロフィール</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <SidebarMenuButton asChild>
                <Link href="/auth/login">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログイン</span>
                </Link>
             </SidebarMenuButton>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 justify-between">
            <SidebarTrigger className="md:hidden"/>
            <div className="flex-1">
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
    </>
  );
}
