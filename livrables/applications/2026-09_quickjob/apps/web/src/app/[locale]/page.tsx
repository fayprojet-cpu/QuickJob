import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Search, ClipboardCheck, Wallet, ArrowRight, Flame } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import { Reveal } from '@/components/ui/reveal';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { ForWhomSection } from '@/components/home/for-whom-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { TrustSection } from '@/components/home/trust-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { FaqSection } from '@/components/home/faq-section';
import { CtaBanner } from '@/components/home/cta-banner';
import { LiveTicker } from '@/components/home/live-ticker';
import { fetchPublishedJobs } from '@/features/jobs/api';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('home');

  // Ne doit jamais faire échouer le build/rendu de la page d'accueil : si
  // l'API est injoignable (build local sans API qui tourne, hoquet réseau),
  // on retombe simplement sur "aucune activité récente" plutôt que planter.
  const latestJobs = await fetchPublishedJobs({ page: 1, limit: 8 }).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    limit: 8,
  }));

  const steps = [
    { icon: Search, title: t('step1Title'), body: t('step1Body') },
    { icon: ClipboardCheck, title: t('step2Title'), body: t('step2Body') },
    { icon: Wallet, title: t('step3Title'), body: t('step3Body') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent-50 via-white to-white px-4 py-20 sm:py-28">
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-200/40 blur-3xl sm:h-96 sm:w-96"
        />
        <div
          aria-hidden
          className="animate-drift-slow pointer-events-none absolute -bottom-32 right-[8%] h-64 w-64 rounded-full bg-accent-300/25 blur-3xl sm:h-80 sm:w-80"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-balance whitespace-pre-line text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-neutral-600 sm:text-lg">
            {t('heroSubtitle')}
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton
              href="/jobs"
              size="lg"
              className="w-full transition-transform hover:scale-[1.03] sm:w-auto"
            >
              {t('browseJobs')}
            </LinkButton>
            <LinkButton
              href="/jobs/new"
              variant="outline"
              size="lg"
              className="w-full transition-transform hover:scale-[1.03] sm:w-auto"
            >
              {t('postAJob')}
            </LinkButton>
          </div>

          {latestJobs.total > 0 ? (
            <p className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-accent-700">
              <Flame className="h-4 w-4" aria-hidden />
              <AnimatedCounter value={latestJobs.total} className="font-bold tabular-nums" />
              <span>{t('activeJobsCount', { count: latestJobs.total })}</span>
            </p>
          ) : null}
        </div>
      </section>

      <LiveTicker jobs={latestJobs.items} locale={locale} />

      {/* Comment ça marche */}
      <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-16">
        <Reveal as="h2" className="text-balance text-center text-2xl font-bold text-neutral-900">
          {t('howItWorksTitle')}
        </Reveal>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 100} className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-700 transition-transform duration-300 hover:scale-110 hover:rotate-6">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-neutral-900">{title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{body}</p>
              {index < steps.length - 1 ? (
                <ArrowRight
                  className="absolute right-[-1.25rem] top-6 hidden h-5 w-5 text-accent-300 sm:block"
                  aria-hidden
                />
              ) : null}
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal><ForWhomSection /></Reveal>
      <Reveal><CategoriesSection /></Reveal>

      <CtaBanner
        title={t('ctaMidTitle')}
        body={t('ctaMidBody')}
        primary={{ label: t('ctaMidButton'), href: '/jobs' }}
      />

      <Reveal><TrustSection /></Reveal>
      <Reveal><TestimonialsSection /></Reveal>
      <Reveal><FaqSection /></Reveal>

      <CtaBanner
        tone="brand"
        title={t('ctaBottomTitle')}
        body={t('ctaBottomBody')}
        primary={{ label: t('ctaBottomButtonWorker'), href: '/jobs' }}
        secondary={{ label: t('ctaBottomButtonEmployer'), href: '/jobs/new' }}
      />
    </div>
  );
}
