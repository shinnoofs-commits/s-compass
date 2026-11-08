
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="パスワードをお忘れですか？">
        <div className="text-center space-y-4">
            <p className="text-muted-foreground">
                パスワードをお忘れの場合は、所属部署の管理者にご連絡ください。
                管理者があなたの代わりにパスワードリセットの手続きを行います。
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
