'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  lang: string;
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({
  lang,
  className = 'text-xs font-semibold text-[#1a8c75] hover:underline disabled:opacity-50',
  children = 'Logout',
}: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Proceed with redirecting even if network request fails
    } finally {
      router.push(`/${lang}/login`);
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={className}
    >
      {isPending ? 'Logging out...' : children}
    </button>
  );
}
