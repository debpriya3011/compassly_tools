export function passwordStrength(value: string) {
  let score = 0;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^\w\s]/.test(value)) score++;
  return ["Very weak", "Weak", "Fair", "Strong", "Very strong"][score];
}

export interface PasswordOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export function generatePassword(length: number, options: PasswordOptions) {
  const size = Math.min(128, Math.max(4, Math.floor(length)));
  const groups = [
    options.uppercase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
    options.lowercase ? "abcdefghijklmnopqrstuvwxyz" : "",
    options.numbers ? "0123456789" : "",
    options.symbols ? "!@#$%^&*()-_=+[]{};:,.?" : "",
  ].filter(Boolean);
  if (!groups.length) throw new Error("Select at least one character set.");
  const clean = (value: string) =>
    options.excludeAmbiguous ? value.replace(/[Il1O0o]/g, "") : value;
  const availableGroups = groups.map(clean).filter(Boolean);
  const alphabet = availableGroups.join("");
  const randomFrom = (value: string) =>
    value[crypto.getRandomValues(new Uint32Array(1))[0] % value.length];
  const password = [
    ...availableGroups.map(randomFrom),
    ...Array.from({ length: Math.max(0, size - availableGroups.length) }, () =>
      randomFrom(alphabet),
    ),
  ];
  for (let index = password.length - 1; index > 0; index--) {
    const replacement =
      crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [password[index], password[replacement]] = [
      password[replacement],
      password[index],
    ];
  }
  return password.join("");
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function removeEmoji(value: string) {
  return value.replace(/\p{Extended_Pictographic}|\uFE0F/gu, "");
}

export function extractPhones(value: string) {
  return (
    value.match(/(?:\+?\d[\d\s().-]{6,}\d)/g)?.map((number) => number.trim()) ||
    []
  );
}

export type FakeAddressLocale = "in" | "us" | "uk" | "ca" | "au";

const fakeAddressParts: Record<
  FakeAddressLocale,
  {
    cities: string[];
    regions: string[];
    postalCodes: string[];
    country: string;
  }
> = {
  in: {
    cities: ["Navapur", "Sundarpur", "Lakeview Nagar", "Shantigram"],
    regions: ["Maharashtra", "Karnataka", "West Bengal", "Gujarat"],
    postalCodes: ["000001", "000017", "000042", "000099"],
    country: "India",
  },
  us: {
    cities: ["Exampleville", "Northfield", "Westhaven", "Sampleton"],
    regions: ["CA", "NY", "TX", "WA"],
    postalCodes: ["00001", "00017", "00042", "00099"],
    country: "United States",
  },
  uk: {
    cities: ["Exampleford", "Northborough", "Westhaven", "Sampleton"],
    regions: ["England", "Scotland", "Wales", "Northern Ireland"],
    postalCodes: ["ZZ0 1ZZ", "ZZ0 2ZZ", "ZZ0 4ZZ", "ZZ0 9ZZ"],
    country: "United Kingdom",
  },
  ca: {
    cities: ["Example Bay", "Northfield", "Westhaven", "Sample Falls"],
    regions: ["ON", "BC", "AB", "QC"],
    postalCodes: ["Z0Z 0Z1", "Z0Z 0Z2", "Z0Z 0Z4", "Z0Z 0Z9"],
    country: "Canada",
  },
  au: {
    cities: ["Example Creek", "Northfield", "Westhaven", "Sample Bay"],
    regions: ["NSW", "VIC", "QLD", "WA"],
    postalCodes: ["0001", "0017", "0042", "0099"],
    country: "Australia",
  },
};

export function generateFakeAddress(locale: FakeAddressLocale) {
  const data = fakeAddressParts[locale];
  const pick = <T>(values: T[]) =>
    values[Math.floor(Math.random() * values.length)];
  const streets = [
    "Example Street",
    "Sample Avenue",
    "Placeholder Road",
    "Demo Lane",
  ];
  return [
    `${Math.floor(Math.random() * 998) + 1} ${pick(streets)}`,
    `Unit ${Math.floor(Math.random() * 90) + 1}`,
    `${pick(data.cities)}, ${pick(data.regions)} ${pick(data.postalCodes)}`,
    data.country,
  ].join("\n");
}
