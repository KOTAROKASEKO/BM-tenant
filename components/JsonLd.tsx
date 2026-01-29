/**
 * JSON-LD for SEO: WebSite + Organization so Google understands
 * "マレーシア 賃貸" "マレーシア 移住" etc.
 */
const BASE_URL = "https://bilikmatch.com";

export default function JsonLd({
  lang,
  isHomePage = false,
}: {
  lang: string;
  isHomePage?: boolean;
}) {
  const isJa = lang === "ja";
  const inLanguage = isJa ? "ja" : "en";
  const name = "Bilik Match";
  const descriptionJa =
    "マレーシア移住・マレーシア賃貸の部屋探し。日本人向けKL周辺の賃貸物件を無料で紹介。";
  const descriptionEn =
    "Find your ideal room in Malaysia. Japanese-friendly rental search and free consultation in KL.";

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: BASE_URL,
    description: isJa ? descriptionJa : descriptionEn,
    inLanguage,
  };

  const webSite = isHomePage
    ? {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name,
        url: `${BASE_URL}/${lang}`,
        description: isJa ? descriptionJa : descriptionEn,
        inLanguage,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${BASE_URL}/${lang}/property?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }
    : null;

  const scripts = webSite ? [organization, webSite] : [organization];

  return (
    <>
      {scripts.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </>
  );
}
