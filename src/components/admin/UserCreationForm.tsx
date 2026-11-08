
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/auth/AuthProvider";

export function UserCreationForm() {
  const { toast } = useToast();
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { appUser } = useAuth();

  async function handleGenerateLink() {
    setIsGenerating(true);
    // This requires the admin to have the correct role in Firestore `users` collection.
    // And security rules must be set up to check that role.
    if (appUser?.role !== 'admin') {
      toast({
        title: "権限がありません",
        description: "招待リンクを作成できるのは管理者のみです。",
        variant: "destructive",
      });
      setIsGenerating(false);
      return;
    }

    try {
      const invitationData = {
        createdAt: serverTimestamp(),
      };
      
      const invitationsCollection = collection(db, "invitations");
      const docRef = await addDoc(invitationsCollection, invitationData);

      const generatedLink = `${window.location.origin}/auth/register?token=${docRef.id}`;
      setInvitationLink(generatedLink);

    } catch (e: any) {
      console.error("Failed to create invitation:", e);
      toast({
        title: "招待リンク作成エラー",
        description: "招待リンクの作成に失敗しました。Firebaseのセキュリティルールが、管理者による'invitations'コレクションへの書き込みを許可しているか確認してください。",
        variant: "destructive",
      });
    } finally {
        setIsGenerating(false);
    }
  }

  const copyToClipboard = () => {
    if (invitationLink) {
        navigator.clipboard.writeText(invitationLink).then(() => {
            toast({ title: "コピーしました", description: "招待リンクをクリップボードにコピーしました。" });
        }, (err) => {
            toast({ title: "コピー失敗", description: "クリップボードへのコピーに失敗しました。", variant: "destructive" });
            console.error('Could not copy text: ', err);
        });
    }
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          以下のボタンを押すと、新規ユーザー登録用のURLが生成されます。
          生成されたURLをコピーし、招待したい方にメールやチャットで送付してください。
          URLは2時間有効で、一度しか使用できません。
        </p>
        <div className="flex justify-end pt-4">
          <Button onClick={handleGenerateLink} disabled={isGenerating} className="w-full sm:w-auto">
            {isGenerating ? "生成中..." : "招待リンクを生成"}
          </Button>
        </div>
      </div>
      
      <AlertDialog open={!!invitationLink} onOpenChange={(open) => !open && setInvitationLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>招待リンクが生成されました</AlertDialogTitle>
            <AlertDialogDescription>
              以下のリンクをコピーして、招待したいユーザーにメール等で送付してください。
              このリンクは2時間有効で、一度しか使用できません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 bg-muted p-2 rounded-md break-all text-sm">
            <code>{invitationLink}</code>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setInvitationLink(null)}>
                閉じる
            </Button>
            <AlertDialogAction onClick={copyToClipboard}>
              リンクをコピー
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
