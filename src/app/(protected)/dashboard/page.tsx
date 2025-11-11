export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Welcome back! Use the navigation (coming soon) to manage tenants, users,
          plans, templates, and more.
        </p>
      </header>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quick Tips
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Connect your account to the backend running at http://localhost:3000.</li>
          <li>
            Start building feature modules (tenants, vCards, plans) after completing
            authentication wiring.
          </li>
          <li>
            Replace this placeholder dashboard with analytics once endpoints are ready.
          </li>
        </ul>
      </section>
    </div>
  );
}
