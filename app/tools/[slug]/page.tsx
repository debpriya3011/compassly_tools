import { notFound } from "next/navigation";
import Link from "next/link";
import { getTool, tools } from "../../lib/catalog";
import ToolClient from "./tool-client";
export async function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = getTool((await params).slug);
  if (!t) return {};
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    keywords: t.keywords,
    alternates: { canonical: `/tools/${t.slug}` },
  };
}
export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = getTool((await params).slug);
  if (!t) notFound();
  const related = tools
    .filter((x) => x.categorySlug === t.categorySlug && x.slug !== t.slug)
    .slice(0, 4);
  const faq = [
    `What does ${t.name} do?`,
    `Is ${t.name} free?`,
    `How accurate is this tool?`,
    `Can I use the result professionally?`,
  ];
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((q) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${t.name} is a free browser-based utility. ${t.purpose}`,
      },
    })),
  };
  return (
    <main className="tool-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <p className="crumb">
        <Link href={`/categories/${t.categorySlug}`}>{t.category}</Link> /{" "}
        {t.name}
      </p>
      <h1>
        <i className={t.icon} />
        {t.name}
      </h1>
      <p className="lead">{t.purpose}</p>
      <ToolClient tool={t} />
      <section className="how">
        <h2>How it works</h2>
        <ol>
          <li>Choose your input or upload a file.</li>
          <li>Set an option if needed, then run the tool.</li>
          <li>Copy or download your result.</li>
        </ol>
      </section>
      <section>
        <h2>Frequently asked questions</h2>
        {faq.map((q) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>
              {t.name} is free to use and processes inputs in your browser
              whenever possible. Check your result before relying on it for
              high-stakes work.
            </p>
          </details>
        ))}
      </section>
      <section>
        <div className="section-title">
          <h2>Related tools</h2>
        </div>
        <div className="tool-grid">
          {related.map((x) => (
            <Link className="tool-card" href={`/tools/${x.slug}`} key={x.slug}>
              <i className={x.icon} />
              <h3>{x.name}</h3>
              <p>{x.purpose}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
