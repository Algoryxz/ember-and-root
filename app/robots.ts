import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/hearth',
        '/root',
        '/journal',
        '/calendar',
        '/satchel',
        '/chronicle',
        '/settings',
        '/onboard',
        '/login',
        '/signup',
        '/awakening',
      ],
    },
    sitemap: 'https://ember-and-root.vercel.app/sitemap.xml',
  };
}
