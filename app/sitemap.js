import { getWorkflows } from '@/lib/store';

export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000';
  const workflows = getWorkflows({});

  const workflowUrls = workflows.map((w) => ({
    url: `${baseUrl}/workflows/${w.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/approvals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/receipts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/metrics`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    ...workflowUrls,
  ];
}
