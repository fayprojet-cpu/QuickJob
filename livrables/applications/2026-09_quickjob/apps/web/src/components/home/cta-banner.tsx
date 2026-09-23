import type { ReactNode } from 'react';
import { LinkButton } from '@/components/ui/link-button';

interface CtaAction {
  label: string;
  href: string;
}

export function CtaBanner({
  title,
  body,
  primary,
  secondary,
  tone = 'light',
}: {
  title: string;
  body?: ReactNode;
  primary: CtaAction;
  secondary?: CtaAction;
  tone?: 'light' | 'brand';
}) {
  const isBrand = tone === 'brand';

  return (
    <section
      className={
        isBrand
          ? 'bg-gradient-to-br from-primary-600 to-primary-500 px-4 py-16 text-white'
          : 'px-4 py-16'
      }
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className={isBrand ? 'text-2xl font-extrabold sm:text-3xl' : 'text-2xl font-bold text-neutral-900'}>
          {title}
        </h2>
        {body ? (
          <p className={isBrand ? 'mx-auto mt-3 max-w-xl text-primary-50' : 'mx-auto mt-3 max-w-xl text-neutral-600'}>
            {body}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton
            href={primary.href}
            size="lg"
            variant={isBrand ? 'outline' : 'primary'}
            className={isBrand ? 'w-full border-white bg-white text-primary-600 hover:bg-primary-50 sm:w-auto' : 'w-full sm:w-auto'}
          >
            {primary.label}
          </LinkButton>
          {secondary ? (
            <LinkButton
              href={secondary.href}
              size="lg"
              variant="outline"
              className={
                isBrand
                  ? 'w-full border-white text-white hover:bg-white/10 sm:w-auto'
                  : 'w-full sm:w-auto'
              }
            >
              {secondary.label}
            </LinkButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}
