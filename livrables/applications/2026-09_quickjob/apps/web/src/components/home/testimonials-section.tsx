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
        <h2 className="text-center text-2xl font-bold text-neutral-900">{t('testimonialsTitle')}</h2>
        <p className="mt-2 text-center text-xs text-neutral-500">{t('testimonialsDisclaimer')}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {testimonials.map(({ quote, name, role }) => (
            <Card key={name} className="p-6">
              <Quote className="h-5 w-5 text-primary-300" aria-hidden />
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">{quote}</p>
              <p className="mt-4 text-sm font-semibold text-neutral-900">{name}</p>
              <p className="text-xs text-neutral-500">{role}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
