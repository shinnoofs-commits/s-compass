"use client";

import { AppShell } from '@/components/layout/AppShell';
import { BellRing, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const initialNotifications: Notification[] = [];

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    // In a real app, you would fetch this data. For the prototype, we use a static list.
    // Using useEffect to set state ensures client-only rendering of this dynamic list.
    setNotifications(initialNotifications);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(currentNotifications => 
      currentNotifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(currentNotifications => 
      currentNotifications.map(n => ({...n, isRead: true}))
    );
    toast({title: "全て既読にしました"});
  };

  const deleteNotification = (id: string) => {
    setNotifications(currentNotifications => 
      currentNotifications.filter(n => n.id !== id)
    );
    toast({title: "通知を削除しました"});
  };

  return (
    <AppShell>
      <div className="container mx-auto max-w-3xl">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">通知センター</CardTitle>
            <CardDescription>あなた宛の通知一覧です。</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <ul className="space-y-4">
                {notifications.map(notification => (
                  <li key={notification.id} className={cn(
                    "p-4 rounded-lg border flex items-start gap-4 transition-colors hover:bg-muted/50",
                    notification.isRead ? "bg-card" : "bg-primary/5 border-primary/30"
                  )}>
                    <div className={cn("mt-1", notification.isRead ? "text-muted-foreground" : "text-primary")}>
                      {notification.isRead ? <CheckCircle className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
                    </div>
                    <div className="flex-grow">
                      <Link href={notification.link} className="hover:underline">
                        <p className={cn("font-medium", !notification.isRead && "text-foreground")}>{notification.message}</p>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(parseISO(notification.createdAt.toString()), { addSuffix: true, locale: ja })}
                      </p>
                    </div>
                     <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => markAsRead(notification.id)}>既読にする</Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(notification.id)} title="削除">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10">
                <BellRing className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">通知はありません</h3>
                <p className="text-muted-foreground">新しい通知がここに表示されます。</p>
              </div>
            )}
             {notifications.length > 0 && (
                <div className="mt-6 text-right">
                    <Button variant="outline" onClick={markAllAsRead}>すべて既読にする</Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
