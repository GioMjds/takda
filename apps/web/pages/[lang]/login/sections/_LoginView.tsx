import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { LoginForm } from './_LoginForm';

interface LoginViewProps {
  lang: string;
}

/**
 * Presentational page component for the owner login view.
 *
 * Server Component — loads the dictionary server-side and hands a
 * tight, typed slice to the client form. The form is the only thing
 * the right panel renders; the layout owns the atmosphere and the
 * left-panel identity content.
 *
 * What used to live here (the centered brand block, the white card)
 * is now the `(auth)/layout.tsx` scene. The view is therefore a thin
 * loader; the form owns all of the visual decisions on the right.
 */
export async function LoginView({ lang }: LoginViewProps) {
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="w-full" suppressHydrationWarning>
      <LoginForm
        lang={lang}
        dict={{
          heading: dict.login.heading,
          subheading: dict.login.subheading,
          email: dict.login.email,
          emailPlaceholder: dict.login.emailPlaceholder,
          password: dict.login.password,
          submit: dict.login.submit,
          error: dict.login.error,
          footer: dict.login.footer,
        }}
      />
    </div>
  );
}

// Next.js Pages Router compatibility dummy export to prevent prerendering errors during next build
export default function ViewDummy() {
  return null;
}
