import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Search, ClipboardCheck, Wallet } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

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
      <section className="bg-gradient-to-b from-primary-50 to-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="whitespace-pre-line text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-neutral-600 sm:text-lg">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-neutral-900">{t('howItWorksTitle')}</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }) => (
            <div key={title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-neutral-900">{title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
