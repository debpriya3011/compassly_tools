/**
 * Comprehensive Math & Statistics Utility Functions
 */

// Helper to parse numbers from dataset string (supports commas, spaces, newlines)
export function parseDataset(input: string): number[] {
  if (!input || !input.trim()) return [];
  const parts = input.trim().split(/[\s,\n\t]+/);
  const numbers: number[] = [];
  for (const p of parts) {
    const num = Number(p);
    if (!isNaN(num)) numbers.push(num);
  }
  return numbers;
}

// Factorial helper
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error("Factorial requires a non-negative integer.");
  if (n > 170) return Infinity; // Limit overflow
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// 1. Scientific Calculator Evaluator
export function evalScientificExpression(expr: string, isDegree: boolean = true): number {
  if (!expr || !expr.trim()) throw new Error("Expression is empty.");

  // Pre-process expression for evaluation
  let sanitized = expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "Math.PI")
    .replace(/\be\b/g, "Math.E")
    .replace(/\^/g, "**");

  // Replace factorials like 5! -> factorial(5)
  sanitized = sanitized.replace(/(\d+(\.\d+)?|\([^\)]+\))!/g, (_, num) => `factorial(${num})`);

  // Handle trig functions with degree conversion
  const toRad = isDegree ? "(Math.PI/180)*" : "";
  const fromRad = isDegree ? "*(180/Math.PI)" : "";

  // Replace functions
  sanitized = sanitized
    .replace(/sin\(/g, `Math.sin(${toRad}`)
    .replace(/cos\(/g, `Math.cos(${toRad}`)
    .replace(/tan\(/g, `Math.tan(${toRad}`)
    .replace(/asin\(/g, `(Math.asin(`)
    .replace(/acos\(/g, `(Math.acos(`)
    .replace(/atan\(/g, `(Math.atan(`)
    .replace(/sinh\(/g, `Math.sinh(`)
    .replace(/cosh\(/g, `Math.cosh(`)
    .replace(/tanh\(/g, `Math.tanh(`)
    .replace(/log10\(/g, `Math.log10(`)
    .replace(/log2\(/g, `Math.log2(`)
    .replace(/log\(/g, `Math.log10(`)
    .replace(/ln\(/g, `Math.log(`)
    .replace(/sqrt\(/g, `Math.sqrt(`)
    .replace(/cbrt\(/g, `Math.cbrt(`)
    .replace(/abs\(/g, `Math.abs(`);

  // If asin/acos/atan were used in degree mode, we post-process arc trig results
  if (isDegree) {
    sanitized = sanitized
      .replace(/Math\.asin\(([^)]+)\)/g, `(Math.asin($1)${fromRad})`)
      .replace(/Math\.acos\(([^)]+)\)/g, `(Math.acos($1)${fromRad})`)
      .replace(/Math\.atan\(([^)]+)\)/g, `(Math.atan($1)${fromRad})`);
  }

  // Safe evaluation using Function
  try {
    const fn = new Function("Math", "factorial", `return ${sanitized};`);
    const val = fn(Math, factorial);
    if (typeof val !== "number" || isNaN(val)) throw new Error("Invalid result.");
    return val;
  } catch (err) {
    throw new Error("Invalid mathematical expression.");
  }
}

// 2. LCM & GCD
export function calculateGCDTwo(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function calculateLCMTwo(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / calculateGCDTwo(a, b));
}

export function calculateGCD(numbers: number[]): { result: number; steps: string } {
  if (!numbers.length) throw new Error("Provide at least one number.");
  let gcd = numbers[0];
  const stepList: string[] = [`Initial GCD: ${gcd}`];
  for (let i = 1; i < numbers.length; i++) {
    const prev = gcd;
    gcd = calculateGCDTwo(gcd, numbers[i]);
    stepList.push(`GCD(${prev}, ${numbers[i]}) = ${gcd}`);
  }
  return { result: gcd, steps: stepList.join("\n") };
}

export function calculateLCM(numbers: number[]): { result: number; steps: string } {
  if (!numbers.length) throw new Error("Provide at least one number.");
  let lcm = numbers[0];
  const stepList: string[] = [`Initial LCM: ${lcm}`];
  for (let i = 1; i < numbers.length; i++) {
    const prev = lcm;
    lcm = calculateLCMTwo(lcm, numbers[i]);
    stepList.push(`LCM(${prev}, ${numbers[i]}) = ${lcm}`);
  }
  return { result: lcm, steps: stepList.join("\n") };
}

// 3. Prime Factorization & Prime Checker
export function primeFactorization(n: number): { factors: number[]; exponential: string; totalFactors: number; allDivisors: number[] } {
  if (!Number.isInteger(n) || n <= 0) throw new Error("Enter a positive integer.");
  let temp = n;
  const factors: number[] = [];
  let d = 2;
  while (temp >= d * d) {
    if (temp % d === 0) {
      factors.push(d);
      temp /= d;
    } else {
      d++;
    }
  }
  if (temp > 1) factors.push(temp);

  // Frequency map for exponential notation
  const freq: Record<number, number> = {};
  for (const f of factors) freq[f] = (freq[f] || 0) + 1;

  const expParts = Object.entries(freq).map(([p, count]) => (count > 1 ? `${p}^${count}` : `${p}`));
  const exponential = expParts.length ? expParts.join(" × ") : `${n}`;

  // Find all divisors
  const divisors: number[] = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      divisors.push(i);
      if (i * i !== n) divisors.push(n / i);
    }
  }
  divisors.sort((a, b) => a - b);

  return { factors, exponential, totalFactors: divisors.length, allDivisors: divisors };
}

export function checkPrime(n: number): { isPrime: boolean; reason: string; nextPrime: number; prevPrime: number } {
  if (!Number.isInteger(n)) throw new Error("Enter an integer.");
  if (n <= 1) return { isPrime: false, reason: `${n} is not a prime number (primes are > 1).`, nextPrime: 2, prevPrime: 0 };
  if (n === 2) return { isPrime: true, reason: "2 is the smallest prime number.", nextPrime: 3, prevPrime: 0 };
  if (n % 2 === 0) return { isPrime: false, reason: `${n} is even and divisible by 2.`, nextPrime: findNextPrime(n), prevPrime: findPrevPrime(n) };

  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) {
      return {
        isPrime: false,
        reason: `${n} is composite (divisible by ${i}).`,
        nextPrime: findNextPrime(n),
        prevPrime: findPrevPrime(n),
      };
    }
  }

  return {
    isPrime: true,
    reason: `${n} has no divisors other than 1 and itself.`,
    nextPrime: findNextPrime(n),
    prevPrime: findPrevPrime(n),
  };
}

function isPrimeHelper(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

function findNextPrime(n: number): number {
  let p = n + 1;
  while (!isPrimeHelper(p)) p++;
  return p;
}

function findPrevPrime(n: number): number {
  let p = n - 1;
  while (p > 1 && !isPrimeHelper(p)) p--;
  return p > 1 ? p : 0;
}

// 4. Equation Solvers (Quadratic & Cubic)
export function solveQuadratic(a: number, b: number, c: number): {
  roots: string[];
  discriminant: number;
  vertex: { h: number; k: number };
  axisOfSymmetry: number;
  steps: string;
} {
  if (a === 0) throw new Error("Coefficient 'a' cannot be 0 in a quadratic equation.");
  const disc = b * b - 4 * a * c;
  const h = -b / (2 * a);
  const k = c - (b * b) / (4 * a);

  let roots: string[] = [];
  let steps = `Equation: ${a}x² + ${b}x + ${c} = 0\n`;
  steps += `Discriminant Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = ${disc}\n`;

  if (disc > 0) {
    const x1 = (-b + Math.sqrt(disc)) / (2 * a);
    const x2 = (-b - Math.sqrt(disc)) / (2 * a);
    roots = [x1.toFixed(4), x2.toFixed(4)];
    steps += `Two distinct real roots:\nx₁ = (-b + √Δ) / 2a = ${roots[0]}\nx₂ = (-b - √Δ) / 2a = ${roots[1]}`;
  } else if (disc === 0) {
    const x = -b / (2 * a);
    roots = [x.toFixed(4)];
    steps += `One repeated real root:\nx = -b / 2a = ${roots[0]}`;
  } else {
    const realPart = (-b / (2 * a)).toFixed(4);
    const imagPart = (Math.sqrt(-disc) / (2 * a)).toFixed(4);
    roots = [`${realPart} + ${imagPart}i`, `${realPart} - ${imagPart}i`];
    steps += `Two complex roots:\nx₁ = ${roots[0]}\nx₂ = ${roots[1]}`;
  }

  return { roots, discriminant: disc, vertex: { h, k }, axisOfSymmetry: h, steps };
}

export function solveCubic(a: number, b: number, c: number, d: number): { roots: string[]; steps: string } {
  if (a === 0) throw new Error("Coefficient 'a' cannot be 0 in a cubic equation.");

  // Normalize ax^3 + bx^2 + cx + d = 0 -> x^3 + Ax^2 + Bx + C = 0
  const A = b / a;
  const B = c / a;
  const C = d / a;

  // Depress cubic x = t - A/3 -> t^3 + pt + q = 0
  const p = B - (A * A) / 3;
  const q = (2 * A * A * A) / 27 - (A * B) / 3 + C;
  const delta = (q * q) / 4 + (p * p * p) / 27;

  const shift = A / 3;
  const roots: string[] = [];
  let steps = `Equation: ${a}x³ + ${b}x² + ${c}x + ${d} = 0\n`;
  steps += `Converted to depressed form t³ + pt + q = 0 with p = ${p.toFixed(4)}, q = ${q.toFixed(4)}\n`;

  if (delta > 0) {
    const u = Math.cbrt(-q / 2 + Math.sqrt(delta));
    const v = Math.cbrt(-q / 2 - Math.sqrt(delta));
    const t1 = u + v;
    const realRoot = t1 - shift;
    const realPart = -(u + v) / 2 - shift;
    const imagPart = ((Math.sqrt(3) / 2) * Math.abs(u - v));

    roots.push(realRoot.toFixed(4));
    roots.push(`${realPart.toFixed(4)} + ${imagPart.toFixed(4)}i`);
    roots.push(`${realPart.toFixed(4)} - ${imagPart.toFixed(4)}i`);
    steps += `1 Real Root and 2 Complex Conjugate Roots.`;
  } else if (delta === 0) {
    const u = Math.cbrt(-q / 2);
    const t1 = 2 * u;
    const t2 = -u;
    roots.push((t1 - shift).toFixed(4));
    roots.push((t2 - shift).toFixed(4));
    steps += `Multiple Real Roots.`;
  } else {
    // 3 real roots (Casus Irreducibilis)
    const r = Math.sqrt(-(p * p * p) / 27);
    const phi = Math.acos(-q / (2 * r));
    const t1 = 2 * Math.cbrt(r) * Math.cos(phi / 3);
    const t2 = 2 * Math.cbrt(r) * Math.cos((phi + 2 * Math.PI) / 3);
    const t3 = 2 * Math.cbrt(r) * Math.cos((phi + 4 * Math.PI) / 3);

    roots.push((t1 - shift).toFixed(4));
    roots.push((t2 - shift).toFixed(4));
    roots.push((t3 - shift).toFixed(4));
    steps += `3 Distinct Real Roots.`;
  }

  return { roots, steps };
}

// 5. Ratio & Aspect Ratio
export function simplifyRatio(a: number, b: number): string {
  if (!a || !b) return `${a}:${b}`;
  const gcd = calculateGCDTwo(a, b);
  return `${a / gcd}:${b / gcd}`;
}

export function solveRatio(a: number, b: number, c?: number, d?: number): { solved: number; formula: string } {
  // A : B = C : D
  if (c !== undefined && d === undefined) {
    // Solve for D: D = (B * C) / A
    if (a === 0) throw new Error("A cannot be 0.");
    const val = (b * c) / a;
    return { solved: val, formula: `D = (B × C) / A = (${b} × ${c}) / ${a} = ${val}` };
  } else if (c === undefined && d !== undefined) {
    // Solve for C: C = (A * D) / B
    if (b === 0) throw new Error("B cannot be 0.");
    const val = (a * d) / b;
    return { solved: val, formula: `C = (A × D) / B = (${a} × ${d}) / ${b} = ${val}` };
  }
  throw new Error("Provide either C or D to solve ratio equation.");
}

export function calculateAspectRatio(w: number, h: number, newW?: number, newH?: number): {
  aspectRatio: string;
  calculatedDimension?: number;
  decimalRatio: number;
} {
  if (w <= 0 || h <= 0) throw new Error("Width and height must be > 0.");
  const ratioStr = simplifyRatio(w, h);
  const decimal = w / h;

  let calculatedDimension: number | undefined;
  if (newW !== undefined && newW > 0) {
    calculatedDimension = newW / decimal;
  } else if (newH !== undefined && newH > 0) {
    calculatedDimension = newH * decimal;
  }

  return { aspectRatio: ratioStr, calculatedDimension, decimalRatio: decimal };
}

// 6. Matrix Calculator (2x2, 3x3, 4x4)
export function matrixDeterminant(m: number[][]): number {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let det = 0;
  for (let j = 0; j < n; j++) {
    const sub = m.slice(1).map((row) => row.filter((_, colIdx) => colIdx !== j));
    det += (j % 2 === 0 ? 1 : -1) * m[0][j] * matrixDeterminant(sub);
  }
  return det;
}

export function matrixTranspose(m: number[][]): number[][] {
  const rows = m.length;
  const cols = m[0].length;
  const res: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      res[c][r] = m[r][c];
    }
  }
  return res;
}

export function matrixTrace(m: number[][]): number {
  let tr = 0;
  for (let i = 0; i < Math.min(m.length, m[0].length); i++) tr += m[i][i];
  return tr;
}

export function matrixAdd(a: number[][], b: number[][]): number[][] {
  return a.map((row, r) => row.map((val, c) => val + b[r][c]));
}

export function matrixSubtract(a: number[][], b: number[][]): number[][] {
  return a.map((row, r) => row.map((val, c) => val - b[r][c]));
}

export function matrixMultiply(a: number[][], b: number[][]): number[][] {
  const rA = a.length;
  const cA = a[0].length;
  const rB = b.length;
  const cB = b[0].length;
  if (cA !== rB) throw new Error(`Cannot multiply ${rA}x${cA} matrix with ${rB}x${cB} matrix.`);
  const res: number[][] = Array.from({ length: rA }, () => Array(cB).fill(0));
  for (let i = 0; i < rA; i++) {
    for (let j = 0; j < cB; j++) {
      for (let k = 0; k < cA; k++) {
        res[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return res;
}

export function matrixInverse(m: number[][]): number[][] {
  const det = matrixDeterminant(m);
  if (Math.abs(det) < 1e-10) throw new Error("Matrix is singular (Determinant = 0), inverse does not exist.");
  const n = m.length;
  if (n === 2) {
    return [
      [m[1][1] / det, -m[0][1] / det],
      [-m[1][0] / det, m[0][0] / det],
    ];
  }

  // Cofactor matrix transpose / det
  const adj: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const sub = m.filter((_, rIdx) => rIdx !== r).map((row) => row.filter((_, cIdx) => cIdx !== c));
      const cofactor = ((r + c) % 2 === 0 ? 1 : -1) * matrixDeterminant(sub);
      adj[c][r] = cofactor / det; // Note transposed assignment
    }
  }
  return adj;
}

// 7. Statistics (Median, Percentile, Standard Deviation, Variance, Z-Score, Average)
export function calculateMedian(nums: number[]): { median: number; sorted: number[] } {
  if (!nums.length) throw new Error("Dataset is empty.");
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { median, sorted };
}

export function calculatePercentile(nums: number[], percentile: number): { percentileValue: number; sorted: number[] } {
  if (!nums.length) throw new Error("Dataset is empty.");
  if (percentile < 0 || percentile > 100) throw new Error("Percentile must be between 0 and 100.");
  const sorted = [...nums].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  const val = sorted[lower] + weight * (sorted[upper] - sorted[lower]);
  return { percentileValue: val, sorted };
}

export function calculateStatsSummary(nums: number[], isSample: boolean = false): {
  count: number;
  sum: number;
  mean: number;
  median: number;
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  sumOfSquares: number;
  standardError: number;
} {
  if (!nums.length) throw new Error("Dataset is empty.");
  const n = nums.length;
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const sorted = [...nums].sort((a, b) => a - b);

  const sumOfSquares = nums.reduce((a, b) => a + (b - mean) ** 2, 0);
  const divisor = isSample ? (n > 1 ? n - 1 : 1) : n;
  const variance = sumOfSquares / divisor;
  const stdDev = Math.sqrt(variance);

  const median = calculateMedian(nums).median;
  const q1 = calculatePercentile(nums, 25).percentileValue;
  const q3 = calculatePercentile(nums, 75).percentileValue;
  const iqr = q3 - q1;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const standardError = stdDev / Math.sqrt(n);

  return {
    count: n,
    sum,
    mean,
    median,
    variance,
    stdDev,
    min,
    max,
    range: max - min,
    q1,
    q3,
    iqr,
    sumOfSquares,
    standardError,
  };
}

export function calculateZScore(x: number, mean: number, stdDev: number): {
  zScore: number;
  cumulativeProbability: number;
  percentile: number;
  explanation: string;
} {
  if (stdDev <= 0) throw new Error("Standard deviation must be > 0.");
  const z = (x - mean) / stdDev;

  // Approximate Error Function (erf) for Cumulative Distribution Function (CDF)
  const cdf = 0.5 * (1 + errorFunction(z / Math.SQRT2));
  const pct = cdf * 100;

  return {
    zScore: z,
    cumulativeProbability: cdf,
    percentile: pct,
    explanation: `Z = (X - μ) / σ = (${x} - ${mean}) / ${stdDev} = ${z.toFixed(4)}. Score is ${Math.abs(z).toFixed(2)} standard deviations ${z >= 0 ? "above" : "below"} the mean.`,
  };
}

// Error function approximation (Abramowitz and Stegun)
function errorFunction(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// 8. Combinatorics (Combinations & Permutations)
export function calculateCombinatorics(n: number, r: number): {
  nCr: number;
  nPr: number;
  nCrRepetition: number;
  nPrRepetition: number;
  steps: string;
} {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0) {
    throw new Error("n and r must be non-negative integers.");
  }
  if (r > n) throw new Error("r cannot be greater than n for combinations/permutations without repetition.");

  const nFact = factorial(n);
  const rFact = factorial(r);
  const nMinusRFact = factorial(n - r);

  const nCr = nFact / (rFact * nMinusRFact);
  const nPr = nFact / nMinusRFact;

  const nPrRepetition = Math.pow(n, r);
  const nCrRepetition = factorial(n + r - 1) / (rFact * factorial(n - 1));

  const steps = `n = ${n}, r = ${r}\n` +
    `Combination nCr = n! / (r! × (n-r)!) = ${n}! / (${r}! × ${n - r}!) = ${nCr}\n` +
    `Permutation nPr = n! / (n-r)! = ${n}! / ${n - r}! = ${nPr}`;

  return { nCr, nPr, nCrRepetition, nPrRepetition, steps };
}

// 9. Percentage Increases & Decreases
export function calculatePercentageIncrease(initial: number, final: number): {
  percentIncrease: number;
  absChange: number;
  multiplier: number;
} {
  if (initial === 0) throw new Error("Initial value cannot be 0 for percentage change.");
  const change = final - initial;
  const pct = (change / Math.abs(initial)) * 100;
  return { percentIncrease: pct, absChange: change, multiplier: final / initial };
}

export function calculatePercentageDecrease(initial: number, final: number): {
  percentDecrease: number;
  absChange: number;
  remainingPercent: number;
} {
  if (initial === 0) throw new Error("Initial value cannot be 0.");
  const change = initial - final;
  const pct = (change / Math.abs(initial)) * 100;
  return { percentDecrease: pct, absChange: change, remainingPercent: (final / initial) * 100 };
}

// 10. Density Calculator
export function calculateDensity(
  mode: "density" | "mass" | "volume",
  val1: number,
  unit1: string,
  val2: number,
  unit2: string
): { result: number; unit: string; formula: string } {
  // Convert inputs to standard SI units (kg, m^3, kg/m^3)
  if (mode === "density") {
    // val1 = Mass, val2 = Volume
    const massKg = unit1 === "g" ? val1 / 1000 : unit1 === "lb" ? val1 * 0.453592 : val1;
    const volM3 = unit2 === "cm3" || unit2 === "mL" ? val2 / 1e6 : unit2 === "L" ? val2 / 1000 : val2;
    if (volM3 <= 0) throw new Error("Volume must be > 0.");
    const densitySI = massKg / volM3; // kg/m^3
    return {
      result: densitySI,
      unit: "kg/m³",
      formula: `Density ρ = Mass / Volume = ${massKg.toFixed(4)} kg / ${volM3.toFixed(4)} m³ = ${densitySI.toFixed(4)} kg/m³`,
    };
  } else if (mode === "mass") {
    // val1 = Density, val2 = Volume
    if (val1 <= 0 || val2 <= 0) throw new Error("Density and Volume must be > 0.");
    const massSI = val1 * val2;
    return {
      result: massSI,
      unit: "kg",
      formula: `Mass m = Density × Volume = ${val1} × ${val2} = ${massSI} kg`,
    };
  } else {
    // val1 = Mass, val2 = Density
    if (val2 <= 0) throw new Error("Density must be > 0.");
    const volSI = val1 / val2;
    return {
      result: volSI,
      unit: "m³",
      formula: `Volume V = Mass / Density = ${val1} / ${val2} = ${volSI} m³`,
    };
  }
}

// 11. Acceleration Calculator
export function calculateAcceleration(
  mode: "vf_vi_t" | "force_mass" | "vf_vi_s",
  v1: number,
  v2: number,
  v3: number
): { acceleration: number; unit: string; formula: string } {
  if (mode === "vf_vi_t") {
    // v1 = vf (m/s), v2 = vi (m/s), v3 = t (s)
    if (v3 <= 0) throw new Error("Time must be > 0.");
    const a = (v1 - v2) / v3;
    return {
      acceleration: a,
      unit: "m/s²",
      formula: `a = (v_f - v_i) / t = (${v1} - ${v2}) / ${v3} = ${a.toFixed(4)} m/s²`,
    };
  } else if (mode === "force_mass") {
    // v1 = Force (N), v2 = Mass (kg)
    if (v2 <= 0) throw new Error("Mass must be > 0.");
    const a = v1 / v2;
    return {
      acceleration: a,
      unit: "m/s²",
      formula: `a = F / m = ${v1} / ${v2} = ${a.toFixed(4)} m/s²`,
    };
  } else {
    // vf^2 = vi^2 + 2as => a = (vf^2 - vi^2) / (2s)
    if (v3 <= 0) throw new Error("Distance must be > 0.");
    const a = (v1 * v1 - v2 * v2) / (2 * v3);
    return {
      acceleration: a,
      unit: "m/s²",
      formula: `a = (v_f² - v_i²) / (2s) = (${v1}² - ${v2}²) / (2 × ${v3}) = ${a.toFixed(4)} m/s²`,
    };
  }
}

// 12. Percentage Calculator
export function calculatePercentage(mode: "percent_of" | "what_percent" | "percent_of_what", val1: number, val2: number): {
  result: number;
  formula: string;
} {
  if (mode === "percent_of") {
    // What is val1% of val2?
    const res = (val1 * val2) / 100;
    return { result: res, formula: `(${val1} / 100) × ${val2} = ${res}` };
  } else if (mode === "what_percent") {
    // val1 is what % of val2?
    if (val2 === 0) throw new Error("Denominator cannot be 0.");
    const res = (val1 / val2) * 100;
    return { result: res, formula: `(${val1} / ${val2}) × 100 = ${res.toFixed(4)}%` };
  } else {
    // val1 is val2% of what?
    if (val2 === 0) throw new Error("Percentage cannot be 0.");
    const res = (val1 * 100) / val2;
    return { result: res, formula: `(${val1} × 100) / ${val2} = ${res.toFixed(4)}` };
  }
}

// 13. Average Calculator (Geometric, Harmonic, Arithmetic)
export function calculateAverage(nums: number[]): {
  arithmeticMean: number;
  geometricMean: number;
  harmonicMean: number;
  median: number;
  min: number;
  max: number;
} {
  if (!nums.length) throw new Error("Dataset is empty.");
  const n = nums.length;
  const sum = nums.reduce((a, b) => a + b, 0);
  const arithmeticMean = sum / n;

  // Geometric Mean: nth root of product (only for positive numbers)
  const allPositive = nums.every((x) => x > 0);
  let geometricMean = 0;
  if (allPositive) {
    const logSum = nums.reduce((a, b) => a + Math.log(b), 0);
    geometricMean = Math.exp(logSum / n);
  }

  // Harmonic Mean: n / sum(1/x)
  let harmonicMean = 0;
  if (allPositive) {
    const recipSum = nums.reduce((a, b) => a + 1 / b, 0);
    harmonicMean = n / recipSum;
  }

  const { median } = calculateMedian(nums);
  const min = Math.min(...nums);
  const max = Math.max(...nums);

  return { arithmeticMean, geometricMean, harmonicMean, median, min, max };
}

// 14. Marks Percentage Calculator
export function calculateMarksPercentage(obtained: number, total: number): {
  percentage: number;
  grade: string;
  gpa10: number;
  formula: string;
} {
  if (total <= 0) throw new Error("Total marks must be > 0.");
  if (obtained < 0) throw new Error("Obtained marks cannot be negative.");
  const pct = (obtained / total) * 100;

  let grade = "F";
  if (pct >= 90) grade = "A+";
  else if (pct >= 80) grade = "A";
  else if (pct >= 70) grade = "B";
  else if (pct >= 60) grade = "C";
  else if (pct >= 50) grade = "D";

  const gpa10 = pct / 10;

  return {
    percentage: pct,
    grade,
    gpa10,
    formula: `Percentage = (${obtained} / ${total}) × 100 = ${pct.toFixed(2)}%`,
  };
}
