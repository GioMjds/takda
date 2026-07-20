'use client';

import { useEffect } from 'react';

export function SwRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Takda PWA Service Worker registered with scope:', registration.scope);
            }
          })
          .catch((error) => {
            console.error('Takda PWA Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
