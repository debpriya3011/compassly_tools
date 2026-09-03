import Link from "next/link";
export const metadata = { title: "Guides | CompasslyTools" };
export default function Blog() {
  return (
    <main className="page">
      <p className="eyebrow">LEARN</p>
      <h1>Practical guides</h1>
      <div className="tool-grid">
        {[
          "How to reduce an image file size",
          "Choosing the right PDF workflow",
          "A simple guide to data conversion",
        ].map((x) => (
          <article className="tool-card" key={x}>
            <p className="eyebrow">GUIDE</p>
            <h2>{x}</h2>
            <p>Clear, browser-first tips for getting the task done.</p>
            <Link href="/categories">Explore tools →</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
