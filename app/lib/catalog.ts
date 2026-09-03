import catalog from "../../public/tools.json";
export type Tool = {
  id: number;
  name: string;
  slug: string;
  keywords: string;
  icon: string;
  category: string;
  categorySlug: string;
  purpose: string;
  metaTitle: string;
  metaDescription: string;
};
export const tools = catalog as Tool[];
export const categories = [
  ...new Map(
    tools.map((t) => [
      t.categorySlug,
      {
        name: t.category,
        slug: t.categorySlug,
        count: tools.filter((x) => x.categorySlug === t.categorySlug).length,
        icon: t.icon,
      },
    ]),
  ).values(),
];
export const getTool = (slug: string) =>
  tools.find((tool) => tool.slug === slug);
