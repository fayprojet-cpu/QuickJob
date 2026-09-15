import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';

export default async function RegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  return (
    <AuthCard
      title={t('registerTitle')}
      footer={
        <>
          {t('registerHaveAccount')}{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">
            {t('loginSubmit')}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
