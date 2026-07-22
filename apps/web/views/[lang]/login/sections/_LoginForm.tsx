'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, HelpCircleIcon, Loader2Icon, XIcon } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { useLoginForm } from '../hooks/_useLoginForm';

interface LoginFormProps {
  lang: string;
  dict: {
    heading: string;
    subheading: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    forgotPassword?: string;
    forgotPasswordNotice?: string;
    submit: string;
    error: { invalid: string; network: string; generic: string };
    footer: string;
  };
}

export function LoginForm({ lang, dict }: LoginFormProps) {
  const { onSubmit, register, errors, apiError, isSubmitting } = useLoginForm(lang);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
      suppressHydrationWarning
      className="w-full space-y-6"
    >
      <header className="space-y-2">
        <h2 className="font-(family-name:--font-display) text-xl font-bold leading-snug tracking-[-0.015em] text-foreground sm:text-2xl">
          {dict.heading}
        </h2>
        <p className="text-[13.5px] font-normal leading-relaxed text-muted-foreground">
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
          registerProps={register('email')}
          error={errors.email?.message}
        />

        {/* Password field + Forgot Password trigger */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[13px] font-medium leading-none tracking-wide text-foreground/90"
            >
              {dict.password}
            </label>
            {dict.forgotPassword && (
              <button
                type="button"
                onClick={() => setShowForgotNotice((prev) => !prev)}
                className="text-[12.5px] font-medium text-primary dark:text-[#5DCAA5] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm"
              >
                {dict.forgotPassword}
              </button>
            )}
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isSubmitting}
              suppressHydrationWarning
              {...register('password')}
              className={`block h-12 w-full rounded-lg border bg-muted/40 px-3.5 pr-12 text-[16px] font-normal text-foreground placeholder:text-muted-foreground/60 transition-colors outline-none hover:border-primary/50 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 ${
                errors.password?.message ? 'border-red-500' : 'border-border/70'
              }`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
              <PasswordToggle
                shown={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          {errors.password?.message && (
            <p className="text-[12px] font-medium text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Account recovery notice banner */}
        {showForgotNotice && dict.forgotPasswordNotice && (
          <div
            role="status"
            aria-live="polite"
            className="relative rounded-lg border border-primary/30 bg-primary/10 p-3.5 text-[12.5px] leading-relaxed text-foreground animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <div className="flex items-start gap-2.5 pr-6">
              <HelpCircleIcon className="mt-0.5 size-4 shrink-0 text-primary dark:text-[#5DCAA5]" aria-hidden="true" />
              <span>{dict.forgotPasswordNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotNotice(false)}
              aria-label="Close notice"
              className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              <XIcon className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Submit + inline error */}
      <div className="space-y-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="group/btn relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
              <span>Signing in…</span>
            </>
          ) : (
            <span>{dict.submit}</span>
          )}
        </button>

        {apiError && (
          <p
            id="login-error"
            role="alert"
            className="animate-in fade-in slide-in-from-top-1 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-[12.5px] font-medium leading-snug text-red-600 dark:text-red-300 duration-200"
          >
            {apiError}
          </p>
        )}
      </div>

      <p className="pt-1 text-[12.5px] font-normal leading-relaxed text-muted-foreground">
        {dict.footer}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  disabled,
  registerProps,
  error,
  endAdornment,
}: {
  id: string;
  label: string;
  type: 'email' | 'password' | 'text';
  autoComplete: string;
  placeholder: string;
  disabled: boolean;
  registerProps?: UseFormRegisterReturn;
  error?: string;
  endAdornment?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[13px] font-medium leading-none tracking-wide text-foreground/90"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          suppressHydrationWarning
          {...registerProps}
          className={`block h-12 w-full rounded-lg border bg-muted/40 px-3.5 text-[16px] font-normal text-foreground placeholder:text-muted-foreground/60 transition-colors outline-none hover:border-primary/50 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? 'border-red-500' : 'border-border/70'
          } ${endAdornment ? 'pr-12' : ''}`}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {endAdornment}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[12px] font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}

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
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {shown ? (
        <EyeOffIcon className="size-4" aria-hidden="true" />
      ) : (
        <EyeIcon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

export default function FormDummy() {
  return null;
}
