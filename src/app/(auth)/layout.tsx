import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">IVGK Digital Cards</h1>
          <p className="text-sm text-slate-600">
            Access your workspace to manage digital cards, templates, tenants, and more.
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}
