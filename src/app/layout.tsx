import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/app/auth/AuthProvider';
import FirebaseErrorListener from '@/firebase/FirebaseErrorListener';

export const metadata: Metadata = {
  title: 'S-Compass',
  description: 'Internal Q&A bulletin board',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <FirebaseErrorListener>
            {children}
          </FirebaseErrorListener>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
