import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CompasslyTools — Free Online Tools",
  description: "300+ fast, free browser-based utilities.",
  metadataBase: new URL("https://compasslytools.com"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header>
          <Link className="brand" href="/">
            Compassly<span>Tools</span>
          </Link>
          <nav>
            <Link href="/categories">Categories</Link>
            <Link href="/blog">Guides</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </header>
        {children}
        <footer>
          <strong>CompasslyTools</strong>
          <p>Useful online tools, built to work in your browser.</p>
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/sitemap.xml">Sitemap</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
