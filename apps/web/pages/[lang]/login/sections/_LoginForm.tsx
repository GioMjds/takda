'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
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
    submit: string;
    error: { invalid: string; network: string; generic: string };
    footer: string;
  };
}

export function LoginForm({ lang, dict }: LoginFormProps) {
  const { onSubmit, register, errors, apiError, isSubmitting } = useLoginForm(lang);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
      suppressHydrationWarning
      className="w-full space-y-6"
    >
      <header className="space-y-1.5">
        <h2 className="text-[18px] font-semibold leading-snug tracking-[-0.015em] text-[#e8f5ef]">
          {dict.heading}
        </h2>
        <p className="text-[13px] font-normal leading-relaxed text-[#e8f5ef]/65">
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

        {/* Password field */}
        <Field
          id="password"
          label={dict.password}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          disabled={isSubmitting}
          registerProps={register('password')}
          error={errors.password?.message}
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
          className="group/btn relative inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#1D9E75] px-4 text-[14px] font-semibold text-[#0a1510] transition-colors hover:bg-[#5DCAA5] hover:text-[#0a1f1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1f1a] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-[#1D9E75] disabled:hover:text-[#0a1510]"
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
            className="animate-in fade-in slide-in-from-top-1 pt-0.5 text-[12.5px] font-medium leading-snug text-red-400 duration-200"
          >
            {apiError}
          </p>
        )}
      </div>

      <p className="pt-1 text-[12px] font-normal leading-relaxed text-[#e8f5ef]/50">
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
        className="block text-[12px] font-medium leading-none tracking-wide text-[#e8f5ef]/70"
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
          className={`block h-11 w-full rounded-[8px] border bg-white/[0.05] px-3.5 text-[14px] font-normal text-[#e8f5ef] placeholder:text-[#e8f5ef]/40 transition-colors outline-none ring-0 hover:border-white/[0.22] focus:border-[#1D9E75] focus:bg-[#1D9E75]/[0.08] focus-visible:border-[#1D9E75] focus-visible:bg-[#1D9E75]/[0.08] disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? 'border-red-500' : 'border-white/[0.14]'
          } ${endAdornment ? 'pr-12' : ''}`}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {endAdornment}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[11.5px] font-medium text-red-400">{error}</p>
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#e8f5ef]/60 transition-colors hover:bg-white/[0.08] hover:text-[#e8f5ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D9E75] disabled:cursor-not-allowed disabled:opacity-50"
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
