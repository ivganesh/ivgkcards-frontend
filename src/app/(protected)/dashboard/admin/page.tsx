export default function AdminDashboardPage() {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
          Admin workspace
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Manage your tenant and team
        </h1>
        <p className="text-sm text-slate-600">
          Invite members, configure plans, and monitor usage. This view will soon
          surface tenant-specific analytics.
        </p>
      </header>
    </section>
  );
}

