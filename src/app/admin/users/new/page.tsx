import { AppShell } from '@/components/layout/AppShell';
import { UserCreationForm } from '@/components/admin/UserCreationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewUserPage() {
  return (
    <AppShell>
      <div className="container mx-auto max-w-2xl">
        <div className="mb-4">
            <Button variant="outline" asChild>
                <Link href="/admin/users">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    ユーザー管理一覧へ戻る
                </Link>
            </Button>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">新規ユーザー招待</CardTitle>
            <CardDescription>招待するユーザーの情報を入力してください。登録用のリンクが生成されます。</CardDescription>
          </CardHeader>
          <CardContent>
            <UserCreationForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
