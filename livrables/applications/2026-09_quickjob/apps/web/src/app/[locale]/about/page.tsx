import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ShieldCheck, Globe2, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default async function AboutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('about');

  const values = [
    { icon: ShieldCheck, title: t('value1Title'), body: t('value1Body') },
    { icon: Globe2, title: t('value2Title'), body: t('value2Body') },
    { icon: Zap, title: t('value3Title'), body: t('value3Body') },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">{t('title')}</h1>
      <p className="mt-4 text-base leading-relaxed text-neutral-600">{t('intro')}</p>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-neutral-900">{t('missionTitle')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t('missionBody')}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-neutral-900">{t('valuesTitle')}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-neutral-900">{title}</h3>
              <p className="mt-1.5 text-sm text-neutral-600">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="contact" className="mt-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-neutral-900">{t('contactTitle')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t('contactBody')}</p>
      </section>

      <section id="legal" className="mt-12 scroll-mt-20 border-t border-neutral-200 pt-8">
        <h2 className="text-xl font-bold text-neutral-900">{t('legalTitle')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">{t('legalBody')}</p>
      </section>
    </div>
  );
}
