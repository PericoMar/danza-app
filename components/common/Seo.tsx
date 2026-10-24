import { Platform } from "react-native";
import Head from "expo-router/head";

import { DEFAULT_OG_IMAGE_URL, DEFAULT_OG_VIDEO, SITE_NAME, absoluteUrl } from "@/constants/seo";

type SeoProps = {
  title: string;
  description: string;
  /** Pathname of the page. Becomes its canonical URL; null leaves it unset. */
  path: string | null;
  /** Absolute URL or app-relative path. Falls back to the site's OG image. */
  image?: string | null;
  /** Keep the page out of search results. */
  noindex?: boolean;
  /** Schema.org payload for rich results. */
  jsonLd?: Record<string, unknown>;
  /** Append " | Danza App" to the title. On by default. */
  appendSiteName?: boolean;
};

/**
 * The tags a crawler and a link preview read. Mounted by <RouteSeo/> for every
 * static page; screens whose copy depends on fetched data mount it themselves,
 * and the deeper instance wins (react-helmet-async resolves by tag identity).
 *
 * Everything but the title is web-only: on native these tags have no meaning
 * beyond the iOS Handoff title.
 */
export default function Seo({
  title,
  description,
  path,
  image,
  noindex,
  jsonLd,
  appendSiteName = true,
}: SeoProps) {
  const fullTitle =
    appendSiteName && title !== SITE_NAME ? `${title} | ${SITE_NAME}` : title;

  if (Platform.OS !== "web") {
    return (
      <Head>
        <title>{fullTitle}</title>
      </Head>
    );
  }

  const canonical = path ? absoluteUrl(path) : null;
  const imageUrl = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE_URL;
  // A page with an image of its own would preview with a video about something else.
  const videoTags: [string, string][] = image
    ? []
    : [
        ["og:video", DEFAULT_OG_VIDEO.url],
        ["og:video:secure_url", DEFAULT_OG_VIDEO.url],
        ["og:video:type", DEFAULT_OG_VIDEO.type],
        ["og:video:width", String(DEFAULT_OG_VIDEO.width)],
        ["og:video:height", String(DEFAULT_OG_VIDEO.height)],
      ];

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow"} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:image" content={imageUrl} />
      {videoTags.map(([property, content]) => (
        <meta key={property} property={property} content={content} />
      ))}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Head>
  );
}
