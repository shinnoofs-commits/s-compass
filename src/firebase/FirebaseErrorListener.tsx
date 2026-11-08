
'use client';

import { useEffect } from 'react';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import { useToast } from '@/hooks/use-toast';

export default function FirebaseErrorListener({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error(error); // Log the full contextual error to the console for debugging
      toast({
        variant: 'destructive',
        title: 'アクセス権限エラー',
        description: '操作を実行する権限がありません。セキュリティルールを確認してください。',
        duration: 10000,
      });
      // In a real app, you might want to show a more detailed dialog
      // or integrate with a proper error reporting service.
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return <>{children}</>;
}
