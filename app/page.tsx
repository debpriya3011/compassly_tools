import Link from "next/link";
import { categories, tools } from "./lib/catalog";
import SearchTools from "./components/search-tools";

export default function Home() {
  const featured = tools.slice(0, 12);
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">FREE • PRIVATE • FAST</p>
        <h1>Everyday tools, without the clutter.</h1>
        <p>
          Convert, calculate, edit, and create with {tools.length}+ free browser
          tools.
        </p>
        <SearchTools />
      </section>
      <section>
        <div className="section-title">
          <h2>Explore categories</h2>
          <Link href="/categories">View all →</Link>
        </div>
        <div className="category-grid">
          {categories.map((c) => (
            <Link
              className="category-card"
              key={c.slug}
              href={`/categories/${c.slug}`}
            >
              <i className={c.icon} />
              <h3>{c.name}</h3>
              <p>{c.count} tools</p>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <div className="section-title">
          <h2>Popular tools</h2>
        </div>
        <div className="tool-grid">
          {featured.map((t) => (
            <Link className="tool-card" href={`/tools/${t.slug}`} key={t.slug}>
              <i className={t.icon} />
              <h3>{t.name}</h3>
              <p>{t.purpose}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
