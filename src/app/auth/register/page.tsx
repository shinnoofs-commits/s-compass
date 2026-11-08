
"use client";

import { AuthLayout } from '@/components/layout/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Invitation } from '@/lib/types';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


function RegisterPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("招待トークンが見つかりません。");
      setIsLoading(false);
      return;
    }

    const verifyToken = async () => {
      const invitationRef = doc(db, 'invitations', token);
      try {
        const invitationSnap = await getDoc(invitationRef);

        if (!invitationSnap.exists()) {
          setError("この招待リンクは無効か、既に使用されています。");
        } else {
          const invitationData = invitationSnap.data() as Invitation;
          const createdAt = (invitationData.createdAt as Timestamp).toDate();
          // 招待リンクの有効期限を2時間に設定
          const twoHoursInMs = 2 * 60 * 60 * 1000;
          if (new Date().getTime() - createdAt.getTime() > twoHoursInMs) {
            setError("この招待リンクの有効期限が切れています（2時間）。管理者に再発行を依頼してください。");
          } else {
            // The token is valid and not expired.
            setInvitationId(invitationSnap.id);
          }
        }
      } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: invitationRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError("招待情報の確認中にエラーが発生しました。");
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  if (isLoading) {
    return (
      <AuthLayout title="招待の確認中...">
        <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">招待情報を確認しています。しばらくお待ちください...</p>
        </div>
      </AuthLayout>
    );
  }

  if (error || !invitationId) {
     return (
        <AuthLayout title="招待エラー">
            <div className="text-center space-y-4">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <p className="text-destructive font-semibold">{error || "招待情報が見つかりませんでした。"}</p>
                <p className="text-muted-foreground">
                お手数ですが、招待リンクが正しいかご確認いただくか、管理者様に再発行を依頼してください。
                </p>
                <Button asChild className="w-full">
                    <Link href="/auth/login">
                        ログイン画面に戻る
                    </Link>
                </Button>
            </div>
        </AuthLayout>
     );
  }

  return (
    <AuthLayout title="新規ユーザー登録">
        <p className="pb-4 text-sm text-muted-foreground">
            ご招待ありがとうございます。以下の情報を入力して、アカウントを作成してください。
        </p>
        <RegisterForm invitationId={invitationId} />
    </AuthLayout>
  );
}


export default function RegisterPage() {
    return (
        <Suspense fallback={
            <AuthLayout title="読み込み中...">
                 <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-center text-muted-foreground">ページを準備しています...</p>
                </div>
            </AuthLayout>
        }>
            <RegisterPageContent />
        </Suspense>
    );
}
