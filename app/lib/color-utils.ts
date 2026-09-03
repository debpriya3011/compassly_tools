export function normalizeHex(value: string) {
  const cleaned = value.trim().replace(/^#/, "");
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((character) => character + character)
          .join("")
      : cleaned;
  if (!/^[0-9a-f]{6}$/i.test(expanded))
    throw new Error("Enter a valid 3- or 6-digit HEX color.");
  return `#${expanded.toUpperCase()}`;
}

export function hexToRgb(value: string) {
  const hex = normalizeHex(value).slice(1);
  return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16),
  };
}

export function rgbToHex(red: number, green: number, blue: number) {
  const channels = [red, green, blue];
  if (
    channels.some(
      (channel) => !Number.isInteger(channel) || channel < 0 || channel > 255,
    )
  ) {
    throw new Error("RGB values must be whole numbers from 0 to 255.");
  }
  return `#${channels
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function luminance(hex: string) {
  const { red, green, blue } = hexToRgb(hex);
  const channels = [red, green, blue].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
