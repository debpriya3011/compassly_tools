import Link from "next/link";
import { categories } from "../lib/catalog";
export const metadata = { title: "Tool Categories | CompasslyTools" };
export default function Categories() {
  return (
    <main className="page">
      <p className="eyebrow">BROWSE</p>
      <h1>All tool categories</h1>
      <div className="category-grid">
        {categories.map((c) => (
          <Link
            className="category-card"
            href={`/categories/${c.slug}`}
            key={c.slug}
          >
            <i className={c.icon} />
            <h2>{c.name}</h2>
            <p>{c.count} free tools</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
