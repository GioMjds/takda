import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://takda.vercel.app'
  ).replace(/\/+$/u, '');

  const routes = ['', '/login', '/onboarding'];
  const locales = ['tl', 'en'];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of locales) {
      const url = `${baseUrl}/${locale}${route}`;
      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'monthly',
        priority: route === '' ? 1.0 : 0.8,
      });
    }
  }

  // Also include the root path
  sitemapEntries.unshift({
    url: `${baseUrl}/`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  });

  return sitemapEntries;
}
