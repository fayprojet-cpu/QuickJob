import { getTranslations } from 'next-intl/server';
import { ShieldCheck, BadgeCheck, Headset } from 'lucide-react';

export async function TrustSection() {
  const t = await getTranslations('home');

  const stats = [
    { value: t('statPaymentValue'), label: t('statPaymentLabel') },
    { value: t('statFeesValue'), label: t('statFeesLabel') },
    { value: t('statSupportValue'), label: t('statSupportLabel') },
  ];

  const badges = [
    { icon: ShieldCheck, title: t('trustEscrowTitle'), body: t('trustEscrowBody') },
    { icon: BadgeCheck, title: t('trustKycTitle'), body: t('trustKycBody') },
    { icon: Headset, title: t('trustSupportTitle'), body: t('trustSupportBody') },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="grid gap-6 rounded-2xl bg-primary-500 px-6 py-8 text-white sm:grid-cols-3 sm:px-10">
        {stats.map(({ value, label }) => (
          <div key={value} className="text-center">
            <p className="text-lg font-extrabold sm:text-xl">{value}</p>
            <p className="mt-1 text-sm text-primary-50">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-balance mt-16 text-center text-2xl font-bold text-neutral-900">{t('trustTitle')}</h2>
      <div className="mt-10 grid gap-8 divide-y divide-neutral-200 sm:grid-cols-3 sm:gap-6 sm:divide-y-0 sm:divide-x">
        {badges.map(({ icon: Icon, title, body }, index) => (
          <div key={title} className={index === 0 ? 'sm:pr-6' : 'pt-8 sm:pt-0 sm:px-6'}>
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 shrink-0 text-primary-600" aria-hidden />
              <h3 className="font-semibold text-neutral-900">{title}</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
