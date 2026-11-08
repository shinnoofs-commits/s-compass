import React from 'react';

export function generateStaticParams() {
  return [{ userId: 'placeholder' }];
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
