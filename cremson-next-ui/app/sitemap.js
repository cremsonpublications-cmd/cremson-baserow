export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const baseUrl = 'https://cremsonpublications.com';

  const staticRoutes = [
    '',
    '/shop',
    '/specimen',
    '/contact-us',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  return staticRoutes;
}
