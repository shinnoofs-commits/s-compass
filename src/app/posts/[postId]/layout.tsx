import React from 'react';

export function generateStaticParams() {
  return [{ postId: 'placeholder' }];
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
