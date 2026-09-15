import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

export function AuthCard({
  title,
  footer,
  children,
}: {
  title: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <Card className="p-6 sm:p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-neutral-900">{title}</h1>
        {children}
        <div className="mt-6 text-center text-sm text-neutral-600">{footer}</div>
      </Card>
    </div>
  );
}
