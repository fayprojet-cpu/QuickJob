import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Search, ClipboardCheck, Wallet, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ForWhomSection } from '@/components/home/for-whom-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { TrustSection } from '@/components/home/trust-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { FaqSection } from '@/components/home/faq-section';
import { CtaBanner } from '@/components/home/cta-banner';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const steps = [
    { icon: Search, title: t('step1Title'), body: t('step1Body') },
    { icon: ClipboardCheck, title: t('step2Title'), body: t('step2Body') },
    { icon: Wallet, title: t('step3Title'), body: t('step3Body') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white px-4 py-20 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-200/40 blur-3xl sm:h-96 sm:w-96"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-balance whitespace-pre-line text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-neutral-600 sm:text-lg">
            {t('heroSubtitle')}
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/jobs">
              <Button size="lg" className="w-full sm:w-auto">
                {t('browseJobs')}
              </Button>
            </Link>
            <Link href="/jobs/new">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                {t('postAJob')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-16">
        <h2 className="text-balance text-center text-2xl font-bold text-neutral-900">{t('howItWorksTitle')}</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, index) => (
            <div key={title} className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-neutral-900">{title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{body}</p>
              {index < steps.length - 1 ? (
                <ArrowRight
                  className="absolute right-[-1.25rem] top-6 hidden h-5 w-5 text-primary-200 sm:block"
                  aria-hidden
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <ForWhomSection />
      <CategoriesSection />

      <CtaBanner
        title={t('ctaMidTitle')}
        body={t('ctaMidBody')}
        primary={{ label: t('ctaMidButton'), href: '/jobs' }}
      />

      <TrustSection />
      <TestimonialsSection />
      <FaqSection />

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
