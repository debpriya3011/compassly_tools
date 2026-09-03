import type { Tool } from "./catalog";

export type WorkflowGroup =
  | "csv-to-excel"
  | "image-compressor"
  | "image"
  | "pdf"
  | "qr-barcode"
  | "color"
  | "random-fun"
  | "general"
  | "developer"
  | "text"
  | "finance"
  | "math"
  | "unimplemented";

export function workflowGroupFor(tool: Tool): WorkflowGroup {
  if (tool.slug === "csv-to-excel") return "csv-to-excel";
  if (tool.slug === "image-compressor") return "image-compressor";
  if (tool.category === "Image Tools") return "image";
  if (tool.category === "PDF Tools" || tool.category === "PDF Converters")
    return "pdf";
  if (tool.category === "QR & Barcode Tools") return "qr-barcode";
  if (tool.category === "Color Tools") return "color";
  if (tool.category === "Random & Fun Tools") return "random-fun";
  if (tool.category === "General Utilities" || tool.category === "Date & Time Tools" || tool.category === "Unit & Data Converters") return "general";
  if (tool.category === "Developer Tools" || tool.category === "SEO & Web Tools") return "developer";
  if (tool.category === "Text Tools") return "text";
  if (tool.category === "Finance Calculators" || tool.category === "Business & Marketing") return "finance";
  if (
    tool.category === "Math & Statistics" ||
    tool.category === "Education Calculators" ||
    tool.category === "Construction & Engineering" ||
    [
      "scientific-calculator",
      "standard-calculator",
      "lcm-calculator",
      "gcd-calculator",
      "prime-factorization-calculator",
      "prime-number-checker",
      "quadratic-equation-solver",
      "cubic-equation-solver",
      "ratio-calculator",
      "aspect-ratio-calculator",
      "matrix-calculator",
      "median-calculator",
      "percentile-calculator",
      "standard-deviation-calculator",
      "variance-calculator",
      "z-score-calculator",
      "percentage-increase-calculator",
      "percentage-decrease-calculator",
      "combination-calculator",
      "density-calculator",
      "acceleration-calculator",
      "percentage-calculator",
      "average-calculator",
      "marks-percentage-calculator",
    ].includes(tool.slug)
  )
    return "math";
  return "unimplemented";
}
