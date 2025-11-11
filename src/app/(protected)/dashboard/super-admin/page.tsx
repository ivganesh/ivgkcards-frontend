export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Super Admin Control Center
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Configure global templates, plans, and platform-wide policies. Upcoming
          releases will surface system metrics and onboarding queues here.
        </p>
      </section>
    </div>
  );
}

