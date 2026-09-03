export type TextDiff = {
  added: number;
  removed: number;
  unchanged: number;
  output: string;
};

const MORSE: Record<string, string> = {
  a: ".-",
  b: "-...",
  c: "-.-.",
  d: "-..",
  e: ".",
  f: "..-.",
  g: "--.",
  h: "....",
  i: "..",
  j: ".---",
  k: "-.-",
  l: ".-..",
  m: "--",
  n: "-.",
  o: "---",
  p: ".--.",
  q: "--.-",
  r: ".-.",
  s: "...",
  t: "-",
  u: "..-",
  v: "...-",
  w: ".--",
  x: "-..-",
  y: "-.--",
  z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
};

const FLIPPED: Record<string, string> = {
  a: "ɐ",
  b: "q",
  c: "ɔ",
  d: "p",
  e: "ǝ",
  f: "ɟ",
  g: "ƃ",
  h: "ɥ",
  i: "ᴉ",
  j: "ɾ",
  k: "ʞ",
  l: "l",
  m: "ɯ",
  n: "u",
  o: "o",
  p: "d",
  q: "b",
  r: "ɹ",
  s: "s",
  t: "ʇ",
  u: "n",
  v: "ʌ",
  w: "ʍ",
  x: "x",
  y: "ʎ",
  z: "z",
  "!": "¡",
  "?": "¿",
  ".": "˙",
  ",": "'",
};

const BRAILLE: Record<string, string> = Object.fromEntries(
  [..."abcdefghijklmnopqrstuvwxyz"].map((letter, index) => [
    letter,
    [
      "⠁",
      "⠃",
      "⠉",
      "⠙",
      "⠑",
      "⠋",
      "⠛",
      "⠓",
      "⠊",
      "⠚",
      "⠅",
      "⠇",
      "⠍",
      "⠝",
      "⠕",
      "⠏",
      "⠟",
      "⠗",
      "⠎",
      "⠞",
      "⠥",
      "⠧",
      "⠺",
      "⠭",
      "⠽",
      "⠵",
    ][index],
  ]),
);

const SMALL: Record<string, string> = Object.fromEntries(
  [..."abcdefghijklmnopqrstuvwxyz"].map((letter, index) => [
    letter,
    [..."ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ"][index] ?? letter,
  ]),
);

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.";

export function numberToWords(value: number): string {
  if (!Number.isSafeInteger(value))
    throw new Error("Enter a whole number within the safe integer range.");
  if (value === 0) return "zero";
  if (value < 0) return `minus ${numberToWords(-value)}`;
  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const underThousand = (n: number) => {
    const parts: string[] = [];
    if (n >= 100) {
      parts.push(`${ones[Math.floor(n / 100)]} hundred`);
      n %= 100;
    }
    if (n >= 20) {
      parts.push(tens[Math.floor(n / 10)]);
      if (n % 10) parts.push(ones[n % 10]);
    } else if (n) parts.push(ones[n]);
    return parts.join(" ");
  };
  const scales: Array<[number, string]> = [
    [1_000_000_000_000, "trillion"],
    [1_000_000_000, "billion"],
    [1_000_000, "million"],
    [1_000, "thousand"],
  ];
  const parts: string[] = [];
  let remaining = value;
  for (const [scale, name] of scales) {
    if (remaining >= scale) {
      parts.push(`${underThousand(Math.floor(remaining / scale))} ${name}`);
      remaining %= scale;
    }
  }
  if (remaining) parts.push(underThousand(remaining));
  return parts.join(" ");
}

export function wordsToNumber(input: string): number {
  const values: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };
  const tokens = input
    .toLowerCase()
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((word) => word !== "and");
  if (!tokens.length) throw new Error("Enter a number written in words.");
  let total = 0;
  let current = 0;
  let negative = false;
  const scales: Record<string, number> = {
    thousand: 1_000,
    million: 1_000_000,
    billion: 1_000_000_000,
    trillion: 1_000_000_000_000,
  };
  for (const token of tokens) {
    if (token === "minus" || token === "negative") {
      negative = true;
      continue;
    }
    if (token in values) current += values[token];
    else if (token === "hundred") current = Math.max(1, current) * 100;
    else if (token in scales) {
      const scale = scales[token];
      total += Math.max(1, current) * scale;
      current = 0;
    } else throw new Error(`“${token}” is not a recognized number word.`);
  }
  return (total + current) * (negative ? -1 : 1);
}

export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999)
    throw new Error("Enter a whole number from 1 to 3999.");
  const numerals: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let output = "";
  for (const [amount, symbol] of numerals)
    while (value >= amount) {
      output += symbol;
      value -= amount;
    }
  return output;
}

export function fromRoman(input: string): number {
  const roman = input.trim().toUpperCase();
  const values: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  let result = 0;
  for (let i = 0; i < roman.length; i++)
    result +=
      values[roman[i]] < (values[roman[i + 1]] || 0)
        ? -values[roman[i]]
        : values[roman[i]];
  if (!roman || Number.isNaN(result) || toRoman(result) !== roman)
    throw new Error("Enter a valid Roman numeral from I to MMMCMXCIX.");
  return result;
}

export function textDifference(before: string, after: string): TextDiff {
  const left = before.split(/\s+/).filter(Boolean);
  const right = after.split(/\s+/).filter(Boolean);
  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array(right.length + 1).fill(0),
  );
  for (let i = left.length - 1; i >= 0; i--)
    for (let j = right.length - 1; j >= 0; j--)
      matrix[i][j] =
        left[i] === right[j]
          ? matrix[i + 1][j + 1] + 1
          : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
  const lines: string[] = [];
  let i = 0,
    j = 0,
    added = 0,
    removed = 0,
    unchanged = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      lines.push(`  ${left[i]}`);
      i++;
      j++;
      unchanged++;
    } else if (
      j < right.length &&
      (i === left.length || matrix[i][j + 1] >= matrix[i + 1][j])
    ) {
      lines.push(`+ ${right[j++]}`);
      added++;
    } else {
      lines.push(`- ${left[i++]}`);
      removed++;
    }
  }
  return {
    added,
    removed,
    unchanged,
    output: `Added: ${added}   Removed: ${removed}   Unchanged: ${unchanged}\n\n${lines.join("\n")}`,
  };
}

export function runTextTool(
  slug: string,
  value: string,
  count = 2,
  length = 8,
  secondary = "",
): string {
  const words = value.trim() ? value.trim().split(/\s+/) : [];
  switch (slug) {
    case "text-repeater":
      return Array.from({ length: count }, () => value).join("\n");
    case "word-counter":
      return `${words.length} words\n${value.length} characters\n${value ? value.split(/\r?\n/).length : 0} lines`;
    case "character-counter":
      return `${value.length} characters (including spaces)\n${value.replace(/\s/g, "").length} characters (without spaces)\n${[...value].length} Unicode characters`;
    case "line-counter":
      return `${value ? value.split(/\r?\n/).length : 0} lines`;
    case "case-converter":
      return `UPPERCASE\n${value.toUpperCase()}\n\nlowercase\n${value.toLowerCase()}\n\nTitle Case\n${value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`;
    case "capitalize-text":
      return value
        .toLowerCase()
        .replace(/(^|[.!?]\s+)\w/g, (c) => c.toUpperCase());
    case "flip-text":
    case "upside-down-text-generator":
      return [...value.toLowerCase()]
        .reverse()
        .map((char) => FLIPPED[char] || char)
        .join("");
    case "small-text-generator":
      return [...value]
        .map((char) => SMALL[char.toLowerCase()] || char)
        .join("");
    case "text-to-binary":
      return [...new TextEncoder().encode(value)]
        .map((byte) => byte.toString(2).padStart(8, "0"))
        .join(" ");
    case "binary-to-text": {
      const chunks = value.trim().split(/\s+/);
      if (chunks.some((bits) => !/^[01]{8}$/.test(bits)))
        throw new Error("Use 8-bit binary groups separated by spaces.");
      return new TextDecoder().decode(
        Uint8Array.from(chunks.map((bits) => parseInt(bits, 2))),
      );
    }
    case "morse-code-translator":
      return value
        .toLowerCase()
        .split("")
        .map((char) => (char === " " ? "/" : MORSE[char] || char))
        .join(" ");
    case "morse-code-decoder": {
      const reverse = Object.fromEntries(
        Object.entries(MORSE).map(([key, code]) => [code, key]),
      );
      return value
        .trim()
        .split("/")
        .map((word) =>
          word
            .trim()
            .split(/\s+/)
            .map((code) => reverse[code] || "?")
            .join(""),
        )
        .join(" ");
    }
    case "number-to-words-converter":
      return numberToWords(Number(value));
    case "words-to-number-converter":
      return String(wordsToNumber(value));
    case "roman-numeral-converter":
      return /^\d+$/.test(value.trim())
        ? toRoman(Number(value))
        : String(fromRoman(value));
    case "braille-translator":
      return [...value.toLowerCase()]
        .map((char) => (char === " " ? "⠀" : BRAILLE[char] || char))
        .join("");
    case "lorem-ipsum-generator":
    case "dummy-text-generator":
      return Array.from({ length: count }, () => LOREM).join("\n\n");
    case "random-text-generator":
      return Array.from({ length: count }, () =>
        Array.from(
          { length },
          () => "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)],
        ).join(""),
      ).join(" ");
    case "fancy-text-generator": {
      const circled = [...value].map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x24B6 + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x24D0 + code - 97);
        return c;
      }).join("");

      const gothic = [...value].map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D504 + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D51E + code - 97);
        return c;
      }).join("");

      const scriptFont = [...value].map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D4D0 + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D4EA + code - 97);
        return c;
      }).join("");

      return `Circled:\n${circled}\n\nGothic / Fraktur:\n${gothic}\n\nScript:\n${scriptFont}`;
    }
    case "invisible-text-generator":
      return "\u200B".repeat(count);
    case "text-difference-checker":
      return textDifference(value, secondary).output;
    default:
      throw new Error("This text workflow has not been configured.");
  }
}
