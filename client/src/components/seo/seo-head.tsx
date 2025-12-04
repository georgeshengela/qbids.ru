/**
 * SEO Head Component (Molecule)
 * Renders all meta tags for a page using React Helmet Async
 */

import { Helmet } from 'react-helmet-async';
import type { SEOMetaTags } from '@/lib/seo-utils';

interface SEOHeadProps {
  meta: SEOMetaTags;
  structuredData?: object | object[];
}

/**
 * SEO Head component that injects meta tags into the document head
 * Uses React Helmet Async for proper server-side rendering support
 */
export function SEOHead({ meta, structuredData }: SEOHeadProps) {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{meta.title}</title>
      <meta name="title" content={meta.title} />
      <meta name="description" content={meta.description} />
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      {meta.robots && <meta name="robots" content={meta.robots} />}
      {meta.author && <meta name="author" content={meta.author} />}
      {meta.language && <meta name="language" content={meta.language} />}

      {/* Canonical URL */}
      {meta.canonical && <link rel="canonical" href={meta.canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={meta.ogType || 'website'} />
      {meta.ogUrl && <meta property="og:url" content={meta.ogUrl} />}
      <meta property="og:title" content={meta.ogTitle || meta.title} />
      <meta property="og:description" content={meta.ogDescription || meta.description} />
      {meta.ogImage && <meta property="og:image" content={meta.ogImage} />}
      <meta property="og:site_name" content="QBIDS" />
      <meta property="og:locale" content="ru_RU" />

      {/* Twitter */}
      <meta name="twitter:card" content={meta.twitterCard || 'summary_large_image'} />
      <meta name="twitter:title" content={meta.twitterTitle || meta.ogTitle || meta.title} />
      <meta name="twitter:description" content={meta.twitterDescription || meta.ogDescription || meta.description} />
      {(meta.twitterImage || meta.ogImage) && (
        <meta name="twitter:image" content={meta.twitterImage || meta.ogImage} />
      )}

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

export default SEOHead;
