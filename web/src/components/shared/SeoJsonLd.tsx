type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

export function SeoJsonLd({ data }: { data: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      // This script embeds schema.org data for search engines.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
