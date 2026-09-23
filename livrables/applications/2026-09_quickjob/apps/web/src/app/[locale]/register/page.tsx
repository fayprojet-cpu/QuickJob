import { setRequestLocale } from 'next-intl/server';
import { RegisterFlow } from '@/components/auth/register-flow';

export default async function RegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return <RegisterFlow />;
}
