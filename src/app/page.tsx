import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';

import { env } from '@/config/env';
import {
  heroHighlights,
  coreFeatures,
  planTiers,
  fallbackTemplateGallery,
} from '@/data/marketing';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/layout/navigation';

export const revalidate = 60;

interface TemplateCard {
  id?: number;
  name: string;
  category: string;
  image: string;
}

async function fetchTemplates(): Promise<TemplateCard[]> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/templates?isActive=true`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error('Failed to load templates');
    }

    const templates = (await response.json()) as Array<{
      id: number;
      name: string;
      category: string | null;
      previewUrl: string | null;
    }>;

    const normalized = templates
      .filter((template) => template.previewUrl)
      .map((template) => ({
        id: template.id,
        name: template.name,
        category: template.category ?? 'Template',
        image: template.previewUrl as string,
      }));

    if (normalized.length === 0) {
      return fallbackTemplateGallery;
    }

    return normalized;
  } catch (error) {
    console.error('Error fetching templates for marketing page:', error);
    return fallbackTemplateGallery;
  }
}

export default async function MarketingPage() {
  const templates = await fetchTemplates();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation mode="marketing" />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-700 text-white">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 md:grid-cols-2">
            <div className="space-y-6">
              <p className="inline-flex items-center rounded-full bg-white/20 px-4 py-1 text-sm font-semibold uppercase tracking-wide">
                Full-stack SaaS platform
              </p>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                Build, launch, and scale digital business cards with enterprise
                control.
              </h1>
              <ul className="space-y-3 text-sm leading-relaxed text-indigo-50">
                {heroHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-white" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/register">
                  <Button variant="secondary">Create an account</Button>
                </Link>
                <Link href="#plans">
                  <Button
                    variant="ghost"
                    className="border border-white/40 text-white hover:bg-white/10 flex items-center"
                  >
                    View pricing <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 p-6 shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-100">
                Platform snapshot
              </p>
              <div className="mt-6 space-y-4 text-indigo-50">
                <p>
                  Multi-tenant Nest.js backend with Prisma + PostgreSQL. Automated
                  plan enforcement, R2 storage tracking, and template rendering.
                </p>
                <p>
                  Frontend built with Next.js, Tailwind, Turbopack, and modern DX.
                  Extend effortlessly with dashboards, analytics, and NFC flows.
                </p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-indigo-900/20 to-transparent" />
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold text-slate-900">
              Everything you need to run a digital card SaaS
            </h2>
            <p className="text-sm text-slate-600">
              Inspired by the specification in the base doc – every module is
              designed for handoff between backend and frontend teams.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="plans" className="bg-white py-16">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="space-y-3 text-center">
              <h2 className="text-3xl font-semibold text-slate-900">
                Flexible pricing for every stage
              </h2>
              <p className="text-sm text-slate-600">
                Configure real plans in the admin portal; use these tiers as
                baseline marketing content.
              </p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {planTiers.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-2xl border p-8 shadow-sm transition hover:shadow-lg ${
                    plan.featured
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {plan.name}
                    </p>
                    <p className="text-3xl font-semibold text-slate-900">
                      {plan.price}
                      <span className="text-base font-medium text-slate-500">
                        {' '}
                        {plan.period}
                      </span>
                    </p>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-slate-600">
                    {plan.features.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button
                      variant={plan.featured ? 'primary' : 'secondary'}
                      className="mt-8 w-full"
                    >
                      Choose {plan.name}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="templates" className="bg-slate-900 py-16 text-white">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="space-y-3 text-center">
              <h2 className="text-3xl font-semibold">
                Showcase-ready templates
              </h2>
              <p className="text-sm text-slate-300">
                Switch templates without losing content. Add your own branding,
                media, and calls-to-action.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {templates.map((template) => (
                <div
                  key={template.name}
                  className="overflow-hidden rounded-xl border border-white/20 bg-white/5 shadow-md backdrop-blur"
                >
                  <div className="relative h-40 w-full">
                    <Image
                      src={template.image}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="text-sm font-semibold text-white">
                      {template.name}
                    </p>
                    <p className="text-xs text-slate-300">{template.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} IVGK Digital Cards. Crafted from the
        basedoc requirements – ready to extend.
      </footer>
    </div>
  );
}
