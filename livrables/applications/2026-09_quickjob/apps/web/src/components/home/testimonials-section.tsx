import { getTranslations } from 'next-intl/server';
import { Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';

export async function TestimonialsSection() {
  const t = await getTranslations('home');

  const testimonials = [
    { quote: t('testimonial1Quote'), name: t('testimonial1Name'), role: t('testimonial1Role') },
    { quote: t('testimonial2Quote'), name: t('testimonial2Name'), role: t('testimonial2Role') },
    { quote: t('testimonial3Quote'), name: t('testimonial3Name'), role: t('testimonial3Role') },
  ];

  return (
    <section className="bg-neutral-50 px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-balance text-center text-2xl font-bold text-neutral-900">{t('testimonialsTitle')}</h2>
        <p className="mt-2 text-center text-xs text-neutral-500">{t('testimonialsDisclaimer')}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3 sm:items-center">
          {testimonials.map(({ quote, name, role }, index) => {
            const featured = index === 1;
            return (
              <Card
                key={name}
                className={
                  featured
                    ? 'border-primary-200 bg-primary-50 p-6 sm:scale-105 sm:p-7 sm:shadow-md'
                    : 'p-6'
                }
              >
                <Quote className={featured ? 'h-6 w-6 text-primary-400' : 'h-5 w-5 text-primary-300'} aria-hidden />
                <p
                  className={
                    featured
                      ? 'mt-3 text-base leading-relaxed text-neutral-800'
                      : 'mt-3 text-sm leading-relaxed text-neutral-700'
                  }
                >
                  {quote}
                </p>
                <p className="mt-4 text-sm font-semibold text-neutral-900">{name}</p>
                <p className="text-xs text-neutral-500">{role}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
