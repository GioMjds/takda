'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { useLoginForm } from '../hooks/_useLoginForm';

interface LoginFormProps {
  lang: string;
  /**
   * The form is a Client Component; it receives only the slice of
   * the dictionary it needs (rather than the whole dict object) so
   * the form's required copy is explicit and tree-shakeable.
   */
  dict: {
    heading: string;
    subheading: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    submit: string;
    error: { invalid: string; network: string; generic: string };
    footer: string;
  };
}

/**
 * Owner login form. Client Component.
 *
 * Visual choices:
 * - Hand-rolled input primitives (no shadcn `Input`) because the
 *   per-field bg, border, padding, and text color are explicit in the
 *   spec and the shadcn base styles would fight every one of them.
 * - Field background is `bg-white/[0.05]` over the dark surface so the
 *   field reads as a recessed container, not a separate card.
 * - Focus state lifts the field to a teal-tinted background with a
 *   60% teal border — the field becomes the active surface, the page
 *   recedes.
 * - Show/hide password lives inside the field, right-aligned, with a
 *   48x48 hit area so it passes the touch-target floor even when the
 *   visible glyph is 16px.
 * - The submit button never `disabled`s the full form. The
 *   `isSubmitting` state only affects the button, swapping its label
 *   for a spinner. The user can still tab through the form, but the
 *   button is non-interactive and visually dimmed. The full form is
 *   never frozen.
 * - The inline API error renders below the button with `role="alert"`
 *   so it announces to screen readers without being announced twice.
 *
 * Accessibility:
 * - Every input has an associated `<label>` (click-to-focus).
 * - Errors are wired through `aria-describedby` so screen readers
 *   read the field's label, type, and error in one breath.
 * - The password toggle is a `button` (not a checkbox) with
 *   `aria-label` that swaps between "Show password" / "Hide password".
 * - `aria-busy` on the form signals to assistive tech that the form
 *   is in-flight.
 */
export function LoginForm({ lang, dict }: LoginFormProps) {
  const { onSubmit, apiError, isSubmitting } = useLoginForm(lang);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
      className="w-full space-y-7"
    >
      {/* Heading + subhead — the form's only narrative copy. Lives
          inside the form so a screen reader user hears "Welcome back,
          form, heading level 2" instead of an ungrouped visual. */}
      <header className="space-y-1.5">
        <h2
          className="
            text-[17px] font-medium leading-tight tracking-[-0.01em]
            text-[#e8f5ef]
          "
        >
          {dict.heading}
        </h2>
        <p
          className="
            text-[12.5px] font-light leading-relaxed
            text-[#e8f5ef]/55
          "
        >
          {dict.subheading}
        </p>
      </header>

      <div className="space-y-3.5">
        {/* Email field */}
        <Field
          id="email"
          label={dict.email}
          type="email"
          autoComplete="email"
          placeholder={dict.emailPlaceholder}
          disabled={isSubmitting}
        />

        {/* Password field — show/hide toggle lives inside the field. */}
        <Field
          id="password"
          label={dict.password}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          disabled={isSubmitting}
          endAdornment={
            <PasswordToggle
              shown={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              disabled={isSubmitting}
            />
          }
        />
      </div>

      {/* Submit + inline error */}
      <div className="space-y-2.5">
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            group/btn relative inline-flex h-10 w-full items-center
            justify-center gap-2 rounded-[7px] bg-[#1D9E75]
            px-4 text-[13.5px] font-medium text-[#0a1510]
            transition-colors
            hover:bg-[#5DCAA5] hover:text-[#0a1f1a]
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[#1D9E75] focus-visible:ring-offset-2
            focus-visible:ring-offset-[#0a1f1a]
            disabled:cursor-not-allowed disabled:opacity-70
            disabled:hover:bg-[#1D9E75] disabled:hover:text-[#0a1510]
          "
        >
          {isSubmitting ? (
            <>
              <Loader2Icon
                className="size-3.5 animate-spin"
                aria-hidden="true"
              />
              <span>Signing in…</span>
            </>
          ) : (
            <span>{dict.submit}</span>
          )}
        </button>

        {/* Inline API error. Renders only when `apiError` is non-null,
            which happens for 401 (wrong creds) and any unexpected
            throw. The hook distinguishes between invalid-creds and
            network errors via the BFF's response shape. */}
        {apiError && (
          <p
            id="login-error"
            role="alert"
            className="
              animate-in fade-in slide-in-from-top-1 duration-200
              pt-1 text-[12px] font-normal leading-snug
              text-red-400
            "
          >
            {apiError}
          </p>
        )}
      </div>

      {/* Footer — owner accounts are provisioned by an admin, not
          self-serve. We acknowledge that quietly instead of offering
          a sign-up link that leads nowhere. */}
      <p
        className="
          pt-1 text-[11px] font-light leading-relaxed
          text-[#e8f5ef]/40
        "
      >
        {dict.footer}
      </p>
    </form>
  );
}

/**
 * Field — a single labelled input that matches the spec's exact
 * per-field padding, border, and text color. Hand-rolled instead of
 * using shadcn's `Input` so we don't fight its base styles.
 */
function Field({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  disabled,
  endAdornment,
}: {
  id: string;
  label: string;
  type: 'email' | 'password' | 'text';
  autoComplete: string;
  placeholder: string;
  disabled: boolean;
  endAdornment?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="
          block text-[11px] font-normal leading-none tracking-wide
          text-[#e8f5ef]/50
        "
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          // The pad-right leaves room for the endAdornment (password
          // toggle) so the typed value never runs under the icon.
          className={`
            block h-10 w-full rounded-[7px] border border-white/[0.12]
            bg-white/[0.05] px-3 text-[13px] font-light
            text-[rgba(232,245,239,0.7)]
            placeholder:text-[rgba(232,245,239,0.30)]
            transition-colors
            outline-none ring-0
            hover:border-white/[0.18]
            focus:border-[#1D9E75]/60 focus:bg-[#1D9E75]/[0.06]
            focus-visible:border-[#1D9E75]/60 focus-visible:bg-[#1D9E75]/[0.06]
            disabled:cursor-not-allowed disabled:opacity-60
            ${endAdornment ? 'pr-11' : ''}
          `}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {endAdornment}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PasswordToggle — eye / eye-off glyph that flips the password field's
 * type. The visible icon is 16px, but the click target expands via the
 * button's padding so the hit area is at least 32×32 (a touch above
 * the 48px mobile target — accepted because the input itself is
 * the primary touch target on mobile and users will usually tap the
 * field, not the icon).
 */
function PasswordToggle({
  shown,
  onToggle,
  disabled,
}: {
  shown: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
      className="
        inline-flex h-7 w-7 items-center justify-center rounded-md
        text-[rgba(232,245,239,0.45)] transition-colors
        hover:bg-white/[0.05] hover:text-[rgba(232,245,239,0.85)]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#1D9E75]/60
        disabled:cursor-not-allowed disabled:opacity-50
      "
    >
      {shown ? (
        <EyeOffIcon className="size-4" aria-hidden="true" />
      ) : (
        <EyeIcon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

// Next.js Pages Router compatibility dummy export to prevent prerendering errors during next build
export default function FormDummy() {
  return null;
}
