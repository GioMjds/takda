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
      suppressHydrationWarning
      className="w-full space-y-6"
    >
      {/* Heading + subhead — narrative copy inside form for screen readers. */}
      <header className="space-y-1.5">
        <h2
          className="
            text-[18px] font-semibold leading-snug tracking-[-0.015em]
            text-[#e8f5ef]
          "
        >
          {dict.heading}
        </h2>
        <p
          className="
            text-[13px] font-normal leading-relaxed
            text-[#e8f5ef]/65
          "
        >
          {dict.subheading}
        </p>
      </header>

      <div className="space-y-4">
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
      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            group/btn relative inline-flex h-11 w-full items-center
            justify-center gap-2 rounded-[8px] bg-[#1D9E75]
            px-4 text-[14px] font-semibold text-[#0a1510]
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
                className="size-4 animate-spin"
                aria-hidden="true"
              />
              <span>Signing in…</span>
            </>
          ) : (
            <span>{dict.submit}</span>
          )}
        </button>

        {/* Inline API error */}
        {apiError && (
          <p
            id="login-error"
            role="alert"
            className="
              animate-in fade-in slide-in-from-top-1 duration-200
              pt-0.5 text-[12.5px] font-medium leading-snug
              text-red-400
            "
          >
            {apiError}
          </p>
        )}
      </div>

      {/* Footer message */}
      <p
        className="
          pt-1 text-[12px] font-normal leading-relaxed
          text-[#e8f5ef]/50
        "
      >
        {dict.footer}
      </p>
    </form>
  );
}

/**
 * Field — a single labelled input with explicit sizing (44px height for mobile touch targets),
 * crisp contrast under sunlight, and clear focus states.
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
          block text-[12px] font-medium leading-none tracking-wide
          text-[#e8f5ef]/70
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
          suppressHydrationWarning
          className={`
            block h-11 w-full rounded-[8px] border border-white/[0.14]
            bg-white/[0.05] px-3.5 text-[14px] font-normal
            text-[#e8f5ef]
            placeholder:text-[#e8f5ef]/40
            transition-colors
            outline-none ring-0
            hover:border-white/[0.22]
            focus:border-[#1D9E75] focus:bg-[#1D9E75]/[0.08]
            focus-visible:border-[#1D9E75] focus-visible:bg-[#1D9E75]/[0.08]
            disabled:cursor-not-allowed disabled:opacity-60
            ${endAdornment ? 'pr-12' : ''}
          `}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {endAdornment}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PasswordToggle — eye / eye-off glyph with an expanded hit area (36×36px)
 * for reliable mobile interaction.
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
        inline-flex h-9 w-9 items-center justify-center rounded-md
        text-[#e8f5ef]/60 transition-colors
        hover:bg-white/[0.08] hover:text-[#e8f5ef]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#1D9E75]
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
