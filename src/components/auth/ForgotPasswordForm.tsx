
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from 'next/link';
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";

const formSchema = z.object({
  loginId: z.string().min(1, { message: "ログインIDを入力してください。" }),
});

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loginId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("loginId", "==", values.loginId));
      const querySnapshot = await getDocs(q);

      // To prevent user enumeration, we show a success message even if the user doesn't exist.
      // We only proceed if a user is found.
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userEmail = userDoc.data().email;
        await sendPasswordResetEmail(auth, userEmail);
      }
      
      toast({
        title: "再設定メール送信",
        description: "入力されたログインIDに紐づくアカウントが存在する場合、パスワード再設定用のメールを送信しました。メールボックスをご確認ください。",
      });
      router.push("/auth/login");

    } catch (e) {
      console.error("ForgotPasswordForm: Error sending password reset email:", e);
      toast({
        title: "送信エラー",
        description: "パスワード再設定メールの送信に失敗しました。時間をおいて再度お試しください。",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <p className="text-sm text-muted-foreground">
          登録済みのログインIDを入力してください。パスワード再設定用のリンクをメールでお送りします。
        </p>
        <FormField
          control={form.control}
          name="loginId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ログインID</FormLabel>
              <FormControl>
                <Input placeholder="your_login_id" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">再設定メールを送信</Button>
        <p className="text-center text-sm">
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            ログイン画面に戻る
          </Link>
        </p>
      </form>
    </Form>
  );
}
