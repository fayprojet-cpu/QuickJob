import { getTranslations } from 'next-intl/server';
import { Accordion } from '@/components/ui/accordion';

export async function FaqSection() {
  const t = await getTranslations('home');

  const items = [1, 2, 3, 4, 5].map((n) => ({
    question: t(`faq${n}Q`),
    answer: t(`faq${n}A`),
  }));

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h2 className="text-balance text-center text-2xl font-bold text-neutral-900">{t('faqTitle')}</h2>
      <div className="mt-10">
        <Accordion items={items} />
      </div>
    </section>
  );
}
