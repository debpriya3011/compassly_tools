import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, tools } from "../../lib/catalog";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const list = tools.filter((t) => t.categorySlug === category);
  return {
    title: list[0]
      ? `${list[0].category} | CompasslyTools`
      : "Category not found",
  };
}
export default async function Category({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const list = tools.filter((t) => t.categorySlug === category);
  if (!list.length) notFound();
  return (
    <main className="page">
      <p className="eyebrow">{list.length} FREE TOOLS</p>
      <h1>{list[0].category}</h1>
      <p className="lead">
        Fast, practical tools that run in your browser. Pick a tool to get
        started.
      </p>
      <div className="tool-grid">
        {list.map((t) => (
          <Link className="tool-card" href={`/tools/${t.slug}`} key={t.slug}>
            <i className={t.icon} />
            <h2>{t.name}</h2>
            <p>{t.purpose}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
