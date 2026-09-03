const firstNames = [
  "Avery",
  "Maya",
  "Leo",
  "Nora",
  "Arjun",
  "Zara",
  "Kai",
  "Iris",
];
const lastNames = [
  "Stone",
  "Patel",
  "Rivera",
  "Chen",
  "Martin",
  "Singh",
  "Brooks",
  "Kim",
];
const adjectives = [
  "Bright",
  "Swift",
  "Clever",
  "Bold",
  "Nova",
  "Happy",
  "Pixel",
  "Urban",
];
const nouns = [
  "Fox",
  "Labs",
  "Nest",
  "Works",
  "Wave",
  "Spark",
  "Studio",
  "Craft",
];

export function stablePercentage(first: string, second: string) {
  const combined = `${first.trim().toLowerCase()}|${second.trim().toLowerCase()}`;
  let hash = 0;
  for (const character of combined)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % 101;
}

export function randomInteger(minimum: number, maximum: number) {
  if (
    !Number.isInteger(minimum) ||
    !Number.isInteger(maximum) ||
    minimum > maximum
  )
    throw new Error(
      "Enter whole numbers with minimum no greater than maximum.",
    );
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

export function pickRandom<T>(items: T[]) {
  if (!items.length) throw new Error("Enter at least one item.");
  return items[Math.floor(Math.random() * items.length)];
}

export function generatedName(
  style: "person" | "brand" | "fantasy" = "person",
) {
  if (style === "person")
    return `${pickRandom(firstNames)} ${pickRandom(lastNames)}`;
  if (style === "brand")
    return `${pickRandom(adjectives)} ${pickRandom(nouns)}`;
  return `${pickRandom(["Ae", "Eld", "Mor", "Syl", "Val", "Thal"])}${pickRandom(["oria", "wyn", "ador", "elis", "orin", "ara"])}`;
}

export function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const replacement = Math.floor(Math.random() * (index + 1));
    [result[index], result[replacement]] = [result[replacement], result[index]];
  }
  return result;
}
