
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { Logo } from "@/components/common/Logo";
import { FirebaseError } from "firebase/app";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


const formSchema = z.object({
  loginId: z.string().min(1, { message: "ログインIDまたはメールアドレスを入力してください。" }),
  password: z.string().min(6, { message: "パスワードは6文字以上で入力してください。" }),
  rememberMe: z.boolean().default(false).optional(),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loginId: "",
      password: "",
      rememberMe: true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Set session persistence based on "remember me" checkbox
      const persistence = values.rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      let emailToLogin = values.loginId;

      // If the loginId doesn't look like an email, query firestore for it.
      if (!values.loginId.includes('@')) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("loginId", "==", values.loginId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // To prevent user enumeration, we throw the same error as if password was wrong.
          throw new FirebaseError('auth/invalid-credential', 'Firebase: Error (auth/invalid-credential).');
        }
        
        emailToLogin = querySnapshot.docs[0].data().email;
      }
      
      // Sign in with the resolved email and password
      await signInWithEmailAndPassword(auth, emailToLogin, values.password);
      
      toast({
        title: "ログイン成功",
        description: `ようこそ！ホームへ移動します。`,
      });
      router.push("/");
    } catch (error) {
      console.error("LoginForm: Error during login process:", error);
      
      let description = "ログイン中に予期せぬエラーが発生しました。";
      
      if (error instanceof FirebaseError && (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password')) {
          description = "ログインIDまたはパスワードが正しくありません。";
      }

      toast({
        title: "ログイン失敗",
        description,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col items-center space-y-8 w-full">
      <Logo className="flex-col gap-4 !text-3xl" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
          <FormField
            control={form.control}
            name="loginId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="text" placeholder="ログインID / メールアドレス" className="h-12 bg-transparent text-center border-b-2 border-x-0 border-t-0 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-lg" {...field} />
                </FormControl>
                <FormMessage className="text-center" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="password" placeholder="パスワード" className="h-12 bg-transparent text-center border-b-2 border-x-0 border-t-0 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-lg" {...field} />
                </FormControl>
                <FormMessage className="text-center" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-center space-x-2.5 space-y-0 pt-1 cursor-pointer">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="rememberMe"
                    className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-[#cf2e2e] data-[state=checked]:border-[#cf2e2e]"
                  />
                </FormControl>
                <FormLabel htmlFor="rememberMe" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  ログイン状態を維持する
                </FormLabel>
              </FormItem>
            )}
          />
          <div className="pt-2">
            <Button type="submit" className="w-full h-12 text-lg rounded-full font-semibold shadow-md transition-transform hover:scale-[1.02] bg-[#cf2e2e] hover:bg-[#b02424]">ログイン</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
