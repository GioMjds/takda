import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://takda.vercel.app'
  ).replace(/\/+$/u, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/private/', '/*/dashboard/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
