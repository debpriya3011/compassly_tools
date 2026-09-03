import type { MetadataRoute } from "next";
import { tools, categories } from "./lib/catalog";
const base = "https://compasslytools.com";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, lastModified: new Date() },
    ...categories.map((c) => ({
      url: `${base}/categories/${c.slug}`,
      lastModified: new Date(),
    })),
    ...tools.map((t) => ({
      url: `${base}/tools/${t.slug}`,
      lastModified: new Date(),
    })),
  ];
}
