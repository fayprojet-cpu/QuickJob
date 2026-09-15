import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  return (
    <AuthCard
      title={t('loginTitle')}
      footer={
        <>
          {t('loginNoAccount')}{' '}
          <Link href="/register" className="font-medium text-primary-600 hover:underline">
            {t('registerSubmit')}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
