"use client";

import { useState } from "react";
import type { Tool } from "../../lib/catalog";
import {
  evalScientificExpression,
  calculateLCM,
  calculateGCD,
  primeFactorization,
  checkPrime,
  solveQuadratic,
  solveCubic,
  simplifyRatio,
  solveRatio,
  calculateAspectRatio,
  matrixDeterminant,
  matrixInverse,
  matrixTranspose,
  matrixTrace,
  matrixAdd,
  matrixSubtract,
  matrixMultiply,
  parseDataset,
  calculateMedian,
  calculatePercentile,
  calculateStatsSummary,
  calculateZScore,
  calculateCombinatorics,
  calculatePercentageIncrease,
  calculatePercentageDecrease,
  calculateDensity,
  calculateAcceleration,
  calculatePercentage,
  calculateAverage,
  calculateMarksPercentage,
} from "../../lib/math-tools";

export default function MathToolClient({ tool }: { tool: Tool }) {
  const slug = tool.slug;

  // Generic State
  const [error, setError] = useState("");

  // 1. Scientific & Standard Calculator State
  const [calcExpr, setCalcExpr] = useState("");
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [isDegree, setIsDegree] = useState(true);
  const [calcMemory, setCalcMemory] = useState(0);
  const [calcHistory, setCalcHistory] = useState<string[]>([]);

  // Keypad Click Handler
  const handleCalcInput = (val: string) => {
    setError("");
    if (val === "C") {
      setCalcExpr("");
      setCalcDisplay("0");
    } else if (val === "CE") {
      setCalcDisplay("0");
    } else if (val === "⌫") {
      if (calcExpr.length > 0) {
        const next = calcExpr.slice(0, -1);
        setCalcExpr(next);
        setCalcDisplay(next || "0");
      }
    } else if (val === "=") {
      try {
        const res = evalScientificExpression(calcExpr, isDegree);
        const resStr = String(Number(res.toFixed(10)));
        setCalcDisplay(resStr);
        setCalcHistory((prev) => [`${calcExpr} = ${resStr}`, ...prev.slice(0, 9)]);
        setCalcExpr(resStr);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid calculation.");
      }
    } else if (val === "MC") {
      setCalcMemory(0);
    } else if (val === "MR") {
      const next = calcExpr + calcMemory;
      setCalcExpr(next);
      setCalcDisplay(next);
    } else if (val === "M+") {
      try {
        const res = evalScientificExpression(calcExpr || calcDisplay, isDegree);
        setCalcMemory((prev) => prev + res);
      } catch (e) {}
    } else if (val === "M-") {
      try {
        const res = evalScientificExpression(calcExpr || calcDisplay, isDegree);
        setCalcMemory((prev) => prev - res);
      } catch (e) {}
    } else if (val === "±") {
      if (calcExpr.startsWith("-")) {
        const next = calcExpr.slice(1);
        setCalcExpr(next);
        setCalcDisplay(next || "0");
      } else {
        const next = "-" + calcExpr;
        setCalcExpr(next);
        setCalcDisplay(next);
      }
    } else {
      const next = calcExpr + val;
      setCalcExpr(next);
      setCalcDisplay(next);
    }
  };

  // 2. Matrix Calculator State
  const [matrixSize, setMatrixSize] = useState<2 | 3 | 4>(3);
  const [matrixA, setMatrixA] = useState<number[][]>([
    [1, 2, 3],
    [0, 1, 4],
    [5, 6, 0],
  ]);
  const [matrixB, setMatrixB] = useState<number[][]>([
    [2, 0, 1],
    [3, 4, 0],
    [1, 2, 5],
  ]);
  const [showMatrixB, setShowMatrixB] = useState(false);
  const [matrixResult, setMatrixResult] = useState<string | number[][]>("");

  const updateMatrixSize = (size: 2 | 3 | 4) => {
    setMatrixSize(size);
    setMatrixA(Array.from({ length: size }, () => Array(size).fill(0)));
    setMatrixB(Array.from({ length: size }, () => Array(size).fill(0)));
    setMatrixResult("");
  };

  const updateMatrixCell = (
    matrix: "A" | "B",
    row: number,
    col: number,
    val: number
  ) => {
    if (matrix === "A") {
      const copy = matrixA.map((r) => [...r]);
      copy[row][col] = val;
      setMatrixA(copy);
    } else {
      const copy = matrixB.map((r) => [...r]);
      copy[row][col] = val;
      setMatrixB(copy);
    }
  };

  const handleMatrixOp = (op: string) => {
    setError("");
    try {
      if (op === "det") {
        const d = matrixDeterminant(matrixA);
        setMatrixResult(`Determinant |A| = ${d}`);
      } else if (op === "inv") {
        const inv = matrixInverse(matrixA);
        setMatrixResult(inv);
      } else if (op === "trans") {
        const t = matrixTranspose(matrixA);
        setMatrixResult(t);
      } else if (op === "trace") {
        const tr = matrixTrace(matrixA);
        setMatrixResult(`Trace tr(A) = ${tr}`);
      } else if (op === "add") {
        const res = matrixAdd(matrixA, matrixB);
        setMatrixResult(res);
      } else if (op === "sub") {
        const res = matrixSubtract(matrixA, matrixB);
        setMatrixResult(res);
      } else if (op === "mult") {
        const res = matrixMultiply(matrixA, matrixB);
        setMatrixResult(res);
      }
    } catch (err) {
      setMatrixResult("");
      setError(err instanceof Error ? err.message : "Matrix operation failed.");
    }
  };

  // 3. Form Inputs
  const [numInput1, setNumInput1] = useState<number>(0);
  const [numInput2, setNumInput2] = useState<number>(0);
  const [numInput3, setNumInput3] = useState<number>(0);
  const [numInput4, setNumInput4] = useState<number>(0);
  const [datasetText, setDatasetText] = useState<string>("12, 18, 25, 30, 42, 50, 65, 80");
  const [toolMode, setToolMode] = useState<string>("default");
  const [unit1, setUnit1] = useState<string>("kg");
  const [unit2, setUnit2] = useState<string>("m3");
  const [calculatedOutput, setCalculatedOutput] = useState<any>(null);

  // General Calculator Executor
  const executeTool = () => {
    setError("");
    setCalculatedOutput(null);
    try {
      if (slug === "lcm-calculator") {
        const nums = parseDataset(datasetText);
        setCalculatedOutput(calculateLCM(nums));
      } else if (slug === "gcd-calculator") {
        const nums = parseDataset(datasetText);
        setCalculatedOutput(calculateGCD(nums));
      } else if (slug === "prime-factorization-calculator") {
        setCalculatedOutput(primeFactorization(numInput1));
      } else if (slug === "prime-number-checker") {
        setCalculatedOutput(checkPrime(numInput1));
      } else if (slug === "quadratic-equation-solver") {
        setCalculatedOutput(solveQuadratic(numInput1, numInput2, numInput3));
      } else if (slug === "cubic-equation-solver") {
        setCalculatedOutput(solveCubic(numInput1, numInput2, numInput3, numInput4));
      } else if (slug === "ratio-calculator") {
        if (toolMode === "simplify") {
          setCalculatedOutput({ simplified: simplifyRatio(numInput1, numInput2) });
        } else {
          setCalculatedOutput(solveRatio(numInput1, numInput2, numInput3 || undefined, numInput4 || undefined));
        }
      } else if (slug === "aspect-ratio-calculator") {
        setCalculatedOutput(calculateAspectRatio(numInput1 || 1920, numInput2 || 1080, numInput3 || undefined, numInput4 || undefined));
      } else if (slug === "median-calculator") {
        const nums = parseDataset(datasetText);
        setCalculatedOutput(calculateMedian(nums));
      } else if (slug === "percentile-calculator") {
        const nums = parseDataset(datasetText);
        setCalculatedOutput(calculatePercentile(nums, numInput1));
      } else if (slug === "standard-deviation-calculator" || slug === "variance-calculator") {
        const nums = parseDataset(datasetText);
        const isSample = toolMode === "sample";
        setCalculatedOutput(calculateStatsSummary(nums, isSample));
      } else if (slug === "z-score-calculator") {
        if (toolMode === "direct") {
          setCalculatedOutput(calculateZScore(numInput1, numInput2, numInput3));
        } else {
          const nums = parseDataset(datasetText);
          const stats = calculateStatsSummary(nums, false);
          setCalculatedOutput(calculateZScore(numInput1, stats.mean, stats.stdDev));
        }
      } else if (slug === "percentage-increase-calculator") {
        setCalculatedOutput(calculatePercentageIncrease(numInput1, numInput2));
      } else if (slug === "percentage-decrease-calculator") {
        setCalculatedOutput(calculatePercentageDecrease(numInput1, numInput2));
      } else if (slug === "combination-calculator") {
        setCalculatedOutput(calculateCombinatorics(numInput1, numInput2));
      } else if (slug === "density-calculator") {
        setCalculatedOutput(calculateDensity(toolMode as any || "density", numInput1, unit1, numInput2, unit2));
      } else if (slug === "acceleration-calculator") {
        setCalculatedOutput(calculateAcceleration(toolMode as any || "vf_vi_t", numInput1, numInput2, numInput3));
      } else if (slug === "percentage-calculator") {
        setCalculatedOutput(calculatePercentage(toolMode as any || "percent_of", numInput1, numInput2));
      } else if (slug === "average-calculator") {
        const nums = parseDataset(datasetText);
        setCalculatedOutput(calculateAverage(nums));
      } else if (slug === "marks-percentage-calculator") {
        setCalculatedOutput(calculateMarksPercentage(numInput1, numInput2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed.");
    }
  };

  // Helper renderer for formatted output with CRYSTAL CLEAR TEXT CONTRAST
  const renderFormattedResult = () => {
    if (!calculatedOutput) return null;
    const res = calculatedOutput;

    return (
      <div className="result" style={{ marginTop: "1.5rem", padding: "1.25rem", borderRadius: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <strong style={{ fontSize: "1.2rem", color: "var(--text-color, #0f172a)" }}>Calculation Summary</strong>
          <button
            className="secondary"
            type="button"
            onClick={() => {
              const textToCopy = typeof res === "object" ? JSON.stringify(res, null, 2) : String(res);
              navigator.clipboard.writeText(textToCopy);
            }}
          >
            Copy Summary
          </button>
        </div>

        {/* Quadratic / Cubic Equation Solvers */}
        {res.roots && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Calculated Roots:</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold", fontFamily: "monospace", color: "#38bdf8" }}>
                {res.roots.join(", ")}
              </div>
            </div>
            {res.discriminant !== undefined && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Discriminant (Δ):</div>
                  <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.1rem" }}>{res.discriminant}</div>
                </div>
                <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Vertex (h, k):</div>
                  <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.1rem" }}>({res.vertex.h.toFixed(2)}, {res.vertex.k.toFixed(2)})</div>
                </div>
              </div>
            )}
            {res.steps && (
              <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "0.85rem", borderRadius: "8px", fontSize: "0.875rem", whiteSpace: "pre-wrap", border: "1px solid #334155" }}>
                {res.steps}
              </pre>
            )}
          </div>
        )}

        {/* Prime Factorization */}
        {res.exponential && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Prime Exponential Form:</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#34d399", fontFamily: "monospace" }}>
                {res.exponential}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Prime Factors:</div>
                <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.15rem", fontFamily: "monospace" }}>{res.factors.join(", ")}</div>
              </div>
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Total Divisors:</div>
                <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.15rem", fontFamily: "monospace" }}>{res.totalFactors}</div>
              </div>
            </div>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>All Divisors List:</div>
              <div style={{ fontFamily: "monospace", color: "#38bdf8", fontSize: "1.1rem", fontWeight: "500" }}>{res.allDivisors.join(", ")}</div>
            </div>
          </div>
        )}

        {/* Prime Number Checker */}
        {res.reason && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div
              style={{
                padding: "1rem",
                borderRadius: "8px",
                background: res.isPrime ? "#065f46" : "#881337",
                color: "#ffffff",
                border: `1px solid ${res.isPrime ? "#10b981" : "#f43f5e"}`,
                fontWeight: "bold",
                fontSize: "1.1rem",
              }}
            >
              {res.reason}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Previous Prime:</div>
                <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.1rem" }}>{res.prevPrime || "N/A"}</div>
              </div>
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Next Prime:</div>
                <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.1rem" }}>{res.nextPrime}</div>
              </div>
            </div>
          </div>
        )}

        {/* LCM & GCD */}
        {res.result !== undefined && res.steps && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Final Calculated Result:</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#38bdf8", fontFamily: "monospace" }}>
                {res.result}
              </div>
            </div>
            <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "0.85rem", borderRadius: "8px", fontSize: "0.875rem", whiteSpace: "pre-wrap", border: "1px solid #334155" }}>
              {res.steps}
            </pre>
          </div>
        )}

        {/* Statistical Summaries */}
        {res.stdDev !== undefined && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Mean (μ):</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "bold", color: "#38bdf8" }}>{res.mean.toFixed(4)}</div>
            </div>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Median:</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "bold", color: "#f8fafc" }}>{res.median.toFixed(4)}</div>
            </div>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Std Dev:</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "bold", color: "#34d399" }}>{res.stdDev.toFixed(4)}</div>
            </div>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Variance:</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "bold", color: "#f8fafc" }}>{res.variance.toFixed(4)}</div>
            </div>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Min / Max:</div>
              <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.1rem" }}>{res.min} / {res.max}</div>
            </div>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.8rem", marginBottom: "0.25rem" }}>IQR (Q3 - Q1):</div>
              <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.1rem" }}>{res.iqr.toFixed(4)}</div>
            </div>
          </div>
        )}

        {/* Z-Score Result */}
        {res.zScore !== undefined && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Z-Score (Z):</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#38bdf8", fontFamily: "monospace" }}>
                {res.zScore.toFixed(4)}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Cumulative Probability P(Z ≤ z):</div>
                <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.1rem" }}>{(res.cumulativeProbability * 100).toFixed(2)}%</div>
              </div>
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Percentile Rank:</div>
                <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.1rem" }}>{res.percentile.toFixed(2)}th</div>
              </div>
            </div>
            <div style={{ padding: "0.85rem", background: "#0f172a", color: "#f8fafc", borderRadius: "8px", fontSize: "0.875rem", border: "1px solid #334155" }}>
              {res.explanation}
            </div>
          </div>
        )}

        {/* Combinatorics */}
        {res.nCr !== undefined && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Combinations nCr (No Repetition):</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#38bdf8" }}>{res.nCr}</div>
            </div>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Permutations nPr (No Repetition):</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#34d399" }}>{res.nPr}</div>
            </div>
          </div>
        )}

        {/* Percentage Increase / Decrease */}
        {res.percentIncrease !== undefined || res.percentDecrease !== undefined ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Percentage Change:</div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  color: (res.percentIncrease || -res.percentDecrease) >= 0 ? "#34d399" : "#f43f5e",
                }}
              >
                {res.percentIncrease !== undefined
                  ? `${res.percentIncrease.toFixed(2)}% Increase`
                  : `${res.percentDecrease.toFixed(2)}% Decrease`}
              </div>
            </div>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Absolute Difference:</div>
              <div style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "1.1rem" }}>{res.absChange}</div>
            </div>
          </div>
        ) : null}

        {/* Density & Acceleration & General Formulas */}
        {res.formula && !res.roots && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {res.percentage !== undefined && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Percentage:</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#38bdf8" }}>
                    {res.percentage.toFixed(2)}%
                  </div>
                </div>
                {res.grade && (
                  <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                    <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Grade:</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#34d399" }}>{res.grade}</div>
                  </div>
                )}
                {res.gpa10 && (
                  <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                    <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>10-Point GPA:</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f8fafc" }}>{res.gpa10.toFixed(2)}</div>
                  </div>
                )}
              </div>
            )}

            {res.acceleration !== undefined && (
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Calculated Acceleration:</div>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#38bdf8", fontFamily: "monospace" }}>
                  {res.acceleration.toFixed(4)} {res.unit}
                </div>
              </div>
            )}

            {res.result !== undefined && res.percentage === undefined && (
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Calculated Value:</div>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#38bdf8", fontFamily: "monospace" }}>
                  {res.result} {res.unit || ""}
                </div>
              </div>
            )}

            <div style={{ padding: "0.85rem", background: "#0f172a", color: "#f8fafc", borderRadius: "8px", fontFamily: "monospace", border: "1px solid #334155" }}>
              {res.formula}
            </div>
          </div>
        )}

        {/* Median Calculator */}
        {res.median !== undefined && res.stdDev === undefined && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Calculated Median:</div>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#38bdf8", fontFamily: "monospace" }}>
                {res.median}
              </div>
            </div>
            {res.sorted && (
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Sorted Dataset ({res.sorted.length} items):</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {res.sorted.map((val: number, i: number) => (
                    <span key={i} style={{ padding: "0.35rem 0.65rem", background: "#0f172a", color: "#34d399", borderRadius: "6px", fontFamily: "monospace", fontWeight: "bold" }}>
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Percentile Calculator */}
        {res.percentile !== undefined && res.zScore === undefined && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                {res.targetPercentile ? `${res.targetPercentile}th Percentile Value:` : "Percentile Value:"}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#38bdf8", fontFamily: "monospace" }}>
                {res.percentile}
              </div>
            </div>
            {res.sorted && (
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Sorted Dataset ({res.sorted.length} items):</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {res.sorted.map((val: number, i: number) => (
                    <span key={i} style={{ padding: "0.35rem 0.65rem", background: "#0f172a", color: "#34d399", borderRadius: "6px", fontFamily: "monospace", fontWeight: "bold" }}>
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Universal Structured Card Grid for Unhandled Objects (No raw JSON braces) */}
        {!res.roots &&
          !res.exponential &&
          !res.reason &&
          res.steps === undefined &&
          res.stdDev === undefined &&
          res.zScore === undefined &&
          res.nCr === undefined &&
          res.percentIncrease === undefined &&
          res.percentDecrease === undefined &&
          !res.formula &&
          res.median === undefined &&
          res.percentile === undefined &&
          typeof res === "object" && res !== null && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
              {Object.entries(res).map(([k, v]) => (
                <div key={k} style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "0.85rem", textTransform: "capitalize", marginBottom: "0.25rem" }}>
                    {k.replace(/([A-Z])/g, " $1").trim()}:
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#f8fafc", wordBreak: "break-word" }}>
                    {Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    );
  };

  // --- RENDER SCIENTIFIC & STANDARD CALCULATORS ---
  if (slug === "scientific-calculator" || slug === "standard-calculator") {
    const isScientific = slug === "scientific-calculator";
    return (
      <section className="workbench">
        <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "1fr" }}>
          {/* Display Header */}
          <div
            style={{
              background: "var(--card-bg, #1e293b)",
              borderRadius: "12px",
              padding: "1.25rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              border: "1px solid var(--border-color, #334155)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#cbd5e1",
                fontSize: "0.875rem",
                marginBottom: "0.5rem",
              }}
            >
              <span>{isScientific ? (isDegree ? "DEG" : "RAD") : "STANDARD"}</span>
              <span>{calcMemory !== 0 ? `M: ${calcMemory}` : ""}</span>
            </div>

            <input
              type="text"
              value={calcExpr}
              onChange={(e) => {
                setCalcExpr(e.target.value);
                setCalcDisplay(e.target.value || "0");
              }}
              placeholder="0"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                fontSize: "1.25rem",
                color: "#cbd5e1",
                textAlign: "right",
                fontFamily: "monospace",
                marginBottom: "0.25rem",
              }}
            />

            <div
              style={{
                fontSize: "2.25rem",
                fontWeight: "bold",
                color: "#f8fafc",
                textAlign: "right",
                fontFamily: "monospace",
                overflowX: "auto",
              }}
            >
              {calcDisplay}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                background: "#881337",
                border: "1px solid #f43f5e",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: "bold",
              }}
            >
              {error}
            </div>
          )}

          {/* Keypad Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isScientific
                ? "repeat(5, 1fr)"
                : "repeat(4, 1fr)",
              gap: "0.5rem",
            }}
          >
            {isScientific && (
              <>
                <button
                  type="button"
                  onClick={() => setIsDegree(!isDegree)}
                  className="secondary"
                  style={{ fontWeight: "bold" }}
                >
                  {isDegree ? "DEG" : "RAD"}
                </button>
                <button type="button" onClick={() => handleCalcInput("MC")} className="secondary">
                  MC
                </button>
                <button type="button" onClick={() => handleCalcInput("MR")} className="secondary">
                  MR
                </button>
                <button type="button" onClick={() => handleCalcInput("M+")} className="secondary">
                  M+
                </button>
                <button type="button" onClick={() => handleCalcInput("M-")} className="secondary">
                  M-
                </button>

                <button type="button" onClick={() => handleCalcInput("sin(")} className="secondary">
                  sin
                </button>
                <button type="button" onClick={() => handleCalcInput("cos(")} className="secondary">
                  cos
                </button>
                <button type="button" onClick={() => handleCalcInput("tan(")} className="secondary">
                  tan
                </button>
                <button type="button" onClick={() => handleCalcInput("log(")} className="secondary">
                  log
                </button>
                <button type="button" onClick={() => handleCalcInput("ln(")} className="secondary">
                  ln
                </button>

                <button type="button" onClick={() => handleCalcInput("asin(")} className="secondary">
                  asin
                </button>
                <button type="button" onClick={() => handleCalcInput("acos(")} className="secondary">
                  acos
                </button>
                <button type="button" onClick={() => handleCalcInput("atan(")} className="secondary">
                  atan
                </button>
                <button type="button" onClick={() => handleCalcInput("^2")} className="secondary">
                  x²
                </button>
                <button type="button" onClick={() => handleCalcInput("^3")} className="secondary">
                  x³
                </button>

                <button type="button" onClick={() => handleCalcInput("^")} className="secondary">
                  xʸ
                </button>
                <button type="button" onClick={() => handleCalcInput("sqrt(")} className="secondary">
                  √x
                </button>
                <button type="button" onClick={() => handleCalcInput("cbrt(")} className="secondary">
                  ∛x
                </button>
                <button type="button" onClick={() => handleCalcInput("(")} className="secondary">
                  (
                </button>
                <button type="button" onClick={() => handleCalcInput(")")} className="secondary">
                  )
                </button>

                <button type="button" onClick={() => handleCalcInput("π")} className="secondary">
                  π
                </button>
                <button type="button" onClick={() => handleCalcInput("e")} className="secondary">
                  e
                </button>
                <button type="button" onClick={() => handleCalcInput("!")} className="secondary">
                  n!
                </button>
                <button type="button" onClick={() => handleCalcInput("abs(")} className="secondary">
                  |x|
                </button>
                <button type="button" onClick={() => handleCalcInput("%")} className="secondary">
                  %
                </button>
              </>
            )}

            {!isScientific && (
              <>
                <button type="button" onClick={() => handleCalcInput("MC")} className="secondary">
                  MC
                </button>
                <button type="button" onClick={() => handleCalcInput("MR")} className="secondary">
                  MR
                </button>
                <button type="button" onClick={() => handleCalcInput("M+")} className="secondary">
                  M+
                </button>
                <button type="button" onClick={() => handleCalcInput("M-")} className="secondary">
                  M-
                </button>
              </>
            )}

            {/* Standard Number & Operator Row */}
            <button type="button" onClick={() => handleCalcInput("C")} style={{ background: "#ef4444", color: "#fff" }}>
              C
            </button>
            <button type="button" onClick={() => handleCalcInput("CE")} className="secondary">
              CE
            </button>
            <button type="button" onClick={() => handleCalcInput("⌫")} className="secondary">
              ⌫
            </button>
            <button type="button" onClick={() => handleCalcInput("/")} style={{ background: "#2563eb", color: "#fff" }}>
              ÷
            </button>

            <button type="button" onClick={() => handleCalcInput("7")}>
              7
            </button>
            <button type="button" onClick={() => handleCalcInput("8")}>
              8
            </button>
            <button type="button" onClick={() => handleCalcInput("9")}>
              9
            </button>
            <button type="button" onClick={() => handleCalcInput("*")} style={{ background: "#2563eb", color: "#fff" }}>
              ×
            </button>

            <button type="button" onClick={() => handleCalcInput("4")}>
              4
            </button>
            <button type="button" onClick={() => handleCalcInput("5")}>
              5
            </button>
            <button type="button" onClick={() => handleCalcInput("6")}>
              6
            </button>
            <button type="button" onClick={() => handleCalcInput("-")} style={{ background: "#2563eb", color: "#fff" }}>
              -
            </button>

            <button type="button" onClick={() => handleCalcInput("1")}>
              1
            </button>
            <button type="button" onClick={() => handleCalcInput("2")}>
              2
            </button>
            <button type="button" onClick={() => handleCalcInput("3")}>
              3
            </button>
            <button type="button" onClick={() => handleCalcInput("+")} style={{ background: "#2563eb", color: "#fff" }}>
              +
            </button>

            <button type="button" onClick={() => handleCalcInput("±")} className="secondary">
              ±
            </button>
            <button type="button" onClick={() => handleCalcInput("0")}>
              0
            </button>
            <button type="button" onClick={() => handleCalcInput(".")}>
              .
            </button>
            <button type="button" onClick={() => handleCalcInput("=")} style={{ background: "#059669", color: "#fff", fontWeight: "bold" }}>
              =
            </button>
          </div>

          {/* History */}
          {calcHistory.length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "#0f172a",
                borderRadius: "8px",
                border: "1px solid #334155",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#cbd5e1" }}>
                Calculation History
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "150px", overflowY: "auto" }}>
                {calcHistory.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      padding: "0.35rem 0.6rem",
                      borderRadius: "4px",
                      background: "#1e293b",
                      color: "#f8fafc",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      const resVal = item.split("=")[1]?.trim();
                      if (resVal) {
                        setCalcExpr(resVal);
                        setCalcDisplay(resVal);
                      }
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // --- RENDER MATRIX CALCULATOR ---
  if (slug === "matrix-calculator") {
    return (
      <section className="workbench">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontWeight: "bold" }}>Matrix Dimensions:</label>
            {[2, 3, 4].map((size) => (
              <button
                key={size}
                type="button"
                className={matrixSize === size ? "" : "secondary"}
                onClick={() => updateMatrixSize(size as 2 | 3 | 4)}
              >
                {size} × {size}
              </button>
            ))}
            <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={showMatrixB}
                onChange={(e) => setShowMatrixB(e.target.checked)}
              />
              Enable Matrix B (for Dual Matrix Ops)
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: showMatrixB ? "1fr 1fr" : "1fr", gap: "1.5rem" }}>
            {/* Matrix A */}
            <div>
              <h3 style={{ marginBottom: "0.5rem" }}>Matrix A</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${matrixSize}, 1fr)`,
                  gap: "0.5rem",
                }}
              >
                {matrixA.map((row, r) =>
                  row.map((val, c) => (
                    <input
                      key={`a-${r}-${c}`}
                      type="number"
                      value={val}
                      onChange={(e) => updateMatrixCell("A", r, c, Number(e.target.value))}
                      style={{ textAlign: "center", fontFamily: "monospace", fontSize: "1.1rem" }}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Matrix B */}
            {showMatrixB && (
              <div>
                <h3 style={{ marginBottom: "0.5rem" }}>Matrix B</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${matrixSize}, 1fr)`,
                    gap: "0.5rem",
                  }}
                >
                  {matrixB.map((row, r) =>
                    row.map((val, c) => (
                      <input
                        key={`b-${r}-${c}`}
                        type="number"
                        value={val}
                        onChange={(e) => updateMatrixCell("B", r, c, Number(e.target.value))}
                        style={{ textAlign: "center", fontFamily: "monospace", fontSize: "1.1rem" }}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Operation Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button type="button" onClick={() => handleMatrixOp("det")}>
              Determinant |A|
            </button>
            <button type="button" onClick={() => handleMatrixOp("inv")}>
              Inverse A⁻¹
            </button>
            <button type="button" onClick={() => handleMatrixOp("trans")}>
              Transpose Aᵀ
            </button>
            <button type="button" onClick={() => handleMatrixOp("trace")}>
              Trace tr(A)
            </button>
            {showMatrixB && (
              <>
                <button type="button" onClick={() => handleMatrixOp("add")} className="secondary">
                  Add (A + B)
                </button>
                <button type="button" onClick={() => handleMatrixOp("sub")} className="secondary">
                  Subtract (A - B)
                </button>
                <button type="button" onClick={() => handleMatrixOp("mult")} className="secondary">
                  Multiply (A × B)
                </button>
              </>
            )}
          </div>

          {error && <div style={{ color: "#ef4444", padding: "0.5rem", fontWeight: "bold" }}>{error}</div>}

          {/* Matrix Result */}
          {matrixResult && (
            <div className="result">
              <strong style={{ color: "var(--text-color, #0f172a)" }}>Matrix Calculation Result</strong>
              {typeof matrixResult === "string" ? (
                <div style={{ padding: "0.85rem", background: "#1e293b", color: "#38bdf8", borderRadius: "8px", fontSize: "1.2rem", fontWeight: "bold", fontFamily: "monospace", marginTop: "0.5rem" }}>
                  {matrixResult}
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${matrixResult[0].length}, minmax(60px, 90px))`,
                    gap: "0.5rem",
                    margin: "1rem 0",
                  }}
                >
                  {matrixResult.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`res-${r}-${c}`}
                        style={{
                          padding: "0.6rem",
                          background: "#1e293b",
                          color: "#f8fafc",
                          borderRadius: "6px",
                          textAlign: "center",
                          fontFamily: "monospace",
                          fontWeight: "bold",
                          border: "1px solid #334155",
                        }}
                      >
                        {Number(val.toFixed(4))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  // --- RENDER DEDICATED TOOL PARAMETER FORMS ---
  return (
    <section className="workbench">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Tool Mode Selectors if applicable */}
        {slug === "ratio-calculator" && (
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="button"
              className={toolMode !== "solve" ? "" : "secondary"}
              onClick={() => setToolMode("simplify")}
            >
              Simplify Ratio (A:B)
            </button>
            <button
              type="button"
              className={toolMode === "solve" ? "" : "secondary"}
              onClick={() => setToolMode("solve")}
            >
              Solve Equivalent Ratio (A:B = C:D)
            </button>
          </div>
        )}

        {(slug === "standard-deviation-calculator" || slug === "variance-calculator") && (
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="button"
              className={toolMode !== "population" ? "" : "secondary"}
              onClick={() => setToolMode("sample")}
            >
              Sample ({slug.includes("standard") ? "s" : "s²"})
            </button>
            <button
              type="button"
              className={toolMode === "population" ? "" : "secondary"}
              onClick={() => setToolMode("population")}
            >
              Population ({slug.includes("standard") ? "σ" : "σ²"})
            </button>
          </div>
        )}

        {slug === "z-score-calculator" && (
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="button"
              className={toolMode !== "dataset" ? "" : "secondary"}
              onClick={() => setToolMode("direct")}
            >
              Direct Parameters (X, μ, σ)
            </button>
            <button
              type="button"
              className={toolMode === "dataset" ? "" : "secondary"}
              onClick={() => setToolMode("dataset")}
            >
              Calculate From Dataset
            </button>
          </div>
        )}

        {slug === "density-calculator" && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className={toolMode === "density" || toolMode === "default" ? "" : "secondary"}
              onClick={() => setToolMode("density")}
            >
              Density (ρ)
            </button>
            <button
              type="button"
              className={toolMode === "mass" ? "" : "secondary"}
              onClick={() => setToolMode("mass")}
            >
              Mass (m)
            </button>
            <button
              type="button"
              className={toolMode === "volume" ? "" : "secondary"}
              onClick={() => setToolMode("volume")}
            >
              Volume (V)
            </button>
          </div>
        )}

        {slug === "percentage-calculator" && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className={toolMode === "percent_of" || toolMode === "default" ? "" : "secondary"}
              onClick={() => setToolMode("percent_of")}
            >
              What is X% of Y?
            </button>
            <button
              type="button"
              className={toolMode === "what_percent" ? "" : "secondary"}
              onClick={() => setToolMode("what_percent")}
            >
              X is what % of Y?
            </button>
            <button
              type="button"
              className={toolMode === "percent_of_what" ? "" : "secondary"}
              onClick={() => setToolMode("percent_of_what")}
            >
              X is Y% of what?
            </button>
          </div>
        )}

        {/* DATASET TEXTAREA INPUT */}
        {[
          "lcm-calculator",
          "gcd-calculator",
          "median-calculator",
          "percentile-calculator",
          "standard-deviation-calculator",
          "variance-calculator",
          "average-calculator",
        ].includes(slug) || (slug === "z-score-calculator" && toolMode === "dataset") ? (
          <div>
            <label className="workbench-label">Numbers Dataset (Separated by commas, spaces, or lines)</label>
            <textarea
              rows={4}
              value={datasetText}
              onChange={(e) => setDatasetText(e.target.value)}
              placeholder="e.g. 10, 15, 22, 34, 45, 50"
            />
          </div>
        ) : null}

        {/* INPUT FIELDS BASED ON TOOL TYPE */}
        <div className="input-grid">
          {slug === "prime-factorization-calculator" || slug === "prime-number-checker" ? (
            <label>
              Number (N)
              <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
            </label>
          ) : null}

          {slug === "quadratic-equation-solver" ? (
            <>
              <label>
                Coefficient a (x²)
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              <label>
                Coefficient b (x)
                <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
              </label>
              <label>
                Constant c
                <input type="number" value={numInput3} onChange={(e) => setNumInput3(Number(e.target.value))} />
              </label>
            </>
          ) : null}

          {slug === "cubic-equation-solver" ? (
            <>
              <label>
                Coefficient a (x³)
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              <label>
                Coefficient b (x²)
                <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
              </label>
              <label>
                Coefficient c (x)
                <input type="number" value={numInput3} onChange={(e) => setNumInput3(Number(e.target.value))} />
              </label>
              <label>
                Constant d
                <input type="number" value={numInput4} onChange={(e) => setNumInput4(Number(e.target.value))} />
              </label>
            </>
          ) : null}

          {slug === "ratio-calculator" && (
            <>
              <label>
                Value A
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              <label>
                Value B
                <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
              </label>
              {toolMode === "solve" && (
                <>
                  <label>
                    Value C (for A:B = C:D)
                    <input type="number" value={numInput3} onChange={(e) => setNumInput3(Number(e.target.value))} />
                  </label>
                  <label>
                    Value D (leave 0 if solving D)
                    <input type="number" value={numInput4} onChange={(e) => setNumInput4(Number(e.target.value))} />
                  </label>
                </>
              )}
            </>
          )}

          {slug === "aspect-ratio-calculator" && (
            <>
              <label>
                Original Width (W₁)
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              <label>
                Original Height (H₁)
                <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
              </label>
              <label>
                New Width (W₂) [Optional]
                <input type="number" value={numInput3} onChange={(e) => setNumInput3(Number(e.target.value))} />
              </label>
              <label>
                New Height (H₂) [Optional]
                <input type="number" value={numInput4} onChange={(e) => setNumInput4(Number(e.target.value))} />
              </label>
            </>
          )}

          {slug === "percentile-calculator" && (
            <label>
              Target Percentile Rank P (0 to 100)
              <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
            </label>
          )}

          {slug === "z-score-calculator" && (
            <>
              <label>
                Raw Score (X)
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              {toolMode !== "dataset" && (
                <>
                  <label>
                    Population Mean (μ)
                    <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
                  </label>
                  <label>
                    Standard Deviation (σ)
                    <input type="number" value={numInput3} onChange={(e) => setNumInput3(Number(e.target.value))} />
                  </label>
                </>
              )}
            </>
          )}

          {(slug === "percentage-increase-calculator" || slug === "percentage-decrease-calculator") && (
            <>
              <label>
                Initial Value (V₁)
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              <label>
                Final Value (V₂)
                <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
              </label>
            </>
          )}

          {slug === "combination-calculator" && (
            <>
              <label>
                Total Items (n)
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              <label>
                Chosen Items (r)
                <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
              </label>
            </>
          )}

          {slug === "density-calculator" && (
            <>
              <label>
                {toolMode === "mass" ? "Density (ρ)" : "Mass (m)"}
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              <label>
                {toolMode === "density" || toolMode === "mass" ? "Volume (V)" : "Density (ρ)"}
                <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
              </label>
            </>
          )}

          {slug === "acceleration-calculator" && (
            <>
              <label>
                Final Velocity (v_f) or Force (F)
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              <label>
                Initial Velocity (v_i) or Mass (m)
                <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
              </label>
              <label>
                Time (t) or Distance (s)
                <input type="number" value={numInput3} onChange={(e) => setNumInput3(Number(e.target.value))} />
              </label>
            </>
          )}

          {slug === "percentage-calculator" && (
            <>
              <label>
                Value 1
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              <label>
                Value 2
                <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
              </label>
            </>
          )}

          {slug === "marks-percentage-calculator" && (
            <>
              <label>
                Marks Obtained
                <input type="number" value={numInput1} onChange={(e) => setNumInput1(Number(e.target.value))} />
              </label>
              <label>
                Total Marks
                <input type="number" value={numInput2} onChange={(e) => setNumInput2(Number(e.target.value))} />
              </label>
            </>
          )}
        </div>

        {/* Calculate Action Button */}
        <button type="button" onClick={executeTool} style={{ marginTop: "0.5rem" }}>
          Calculate {tool.name}
        </button>

        {error && <div style={{ color: "#ef4444", padding: "0.5rem", fontWeight: "bold" }}>{error}</div>}

        {/* Formatted Results Display */}
        {renderFormattedResult()}
      </div>
    </section>
  );
}
