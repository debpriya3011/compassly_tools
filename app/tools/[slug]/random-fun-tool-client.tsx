"use client";

import { useState, useRef, useEffect } from "react";
import type { Tool } from "../../lib/catalog";
import {
  generatedName,
  pickRandom,
  randomInteger,
  shuffled,
  stablePercentage,
} from "../../lib/random-fun-utils";

const parseLines = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const WHEEL_COLORS = [
  "#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#6366f1", "#f97316", "#06b6d4"
];

// --- 1. INTERACTIVE CANVAS WHEEL SPINNER ---
function InteractiveWheelSpinner({ defaultItems = "Alex\nSam\nJordan\nTaylor\nMorgan" }: { defaultItems?: string }) {
  const [textInput, setTextInput] = useState(defaultItems);
  const [items, setItems] = useState<string[]>(() => parseLines(defaultItems));
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const angleRef = useRef<number>(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const list = parseLines(textInput);
    setItems(list.length ? list : ["Item 1", "Item 2", "Item 3"]);
  }, [textInput]);

  const drawWheel = (currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    const numItems = items.length;
    const arc = (2 * Math.PI) / numItems;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < numItems; i++) {
      const startAngle = currentAngle + i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px Inter, sans-serif";
      const label = items[i].length > 14 ? items[i].slice(0, 12) + "…" : items[i];
      ctx.fillText(label, radius - 15, 5);
      ctx.restore();
    }

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★", centerX, centerY + 5);

    // Top Pointer Arrow
    ctx.beginPath();
    ctx.fillStyle = "#f43f5e";
    ctx.moveTo(centerX - 14, 5);
    ctx.lineTo(centerX + 14, 5);
    ctx.lineTo(centerX, 28);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(angleRef.current);
  }, [items]);

  const spinWheel = () => {
    if (isSpinning || items.length === 0) return;
    setIsSpinning(true);
    setWinner(null);

    const totalRotation = Math.PI * 2 * (5 + Math.random() * 5);
    const duration = 4000;
    const startAngle = angleRef.current;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalRotation * easeOut;

      angleRef.current = currentAngle % (2 * Math.PI);
      drawWheel(angleRef.current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const numItems = items.length;
        const arc = (2 * Math.PI) / numItems;
        const finalAngle = angleRef.current % (2 * Math.PI);
        let pointerAngle = (1.5 * Math.PI - finalAngle) % (2 * Math.PI);
        if (pointerAngle < 0) pointerAngle += 2 * Math.PI;

        const winningIdx = Math.floor(pointerAngle / arc) % numItems;
        setWinner(items[winningIdx]);
        setIsSpinning(false);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
      <div
        style={{
          position: "relative",
          padding: "1rem",
          background: "#0f172a",
          borderRadius: "50%",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          border: "4px solid #1e293b",
        }}
      >
        <canvas ref={canvasRef} width={340} height={340} style={{ display: "block" }} />
      </div>

      {winner && (
        <div
          style={{
            padding: "1.25rem 2rem",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#ffffff",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: "0 6px 20px rgba(16,185,129,0.3)",
          }}
        >
          <div style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.9 }}>
            🎉 Winner Selected 🎉
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: "800", marginTop: "0.25rem" }}>
            {winner}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={spinWheel}
        disabled={isSpinning || items.length === 0}
        style={{
          fontSize: "1.2rem",
          fontWeight: "bold",
          padding: "0.85rem 2.5rem",
          background: isSpinning ? "#64748b" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
          color: "#ffffff",
          borderRadius: "50px",
          boxShadow: "0 4px 15px rgba(37,99,235,0.4)",
          cursor: isSpinning ? "not-allowed" : "pointer",
        }}
      >
        {isSpinning ? "Spinning Wheel…" : "🎯 SPIN THE WHEEL!"}
      </button>

      <div style={{ width: "100%", maxWidth: "550px", marginTop: "1rem" }}>
        <label className="workbench-label" style={{ color: "#10213a", fontWeight: "700" }}>
          Wheel Slices / Options (One per line or comma-separated)
        </label>
        <textarea
          rows={5}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Alex&#10;Sam&#10;Jordan&#10;Taylor&#10;Morgan"
        />
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button type="button" className="secondary" onClick={() => setTextInput("Alex\nSam\nJordan\nTaylor\nMorgan")}>
            Load Sample Names
          </button>
          <button type="button" className="secondary" onClick={() => setTextInput(shuffled(items).join("\n"))}>
            Shuffle Slices
          </button>
          <button type="button" className="secondary" onClick={() => setTextInput("")}>
            Clear List
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 2. INTERACTIVE ANIMATED 3D COIN FLIPPER ---
function InteractiveCoinFlipper() {
  const [numCoins, setNumCoins] = useState(1);
  const [isFlipping, setIsFlipping] = useState(false);
  const [coins, setCoins] = useState<("Heads" | "Tails")[]>(["Heads"]);
  const [stats, setStats] = useState({ heads: 0, tails: 0, total: 0 });

  const flipCoins = () => {
    if (isFlipping) return;
    setIsFlipping(true);

    setTimeout(() => {
      const results: ("Heads" | "Tails")[] = [];
      let newHeads = 0;
      let newTails = 0;

      for (let i = 0; i < numCoins; i++) {
        const isHead = Math.random() < 0.5;
        results.push(isHead ? "Heads" : "Tails");
        if (isHead) newHeads++;
        else newTails++;
      }

      setCoins(results);
      setStats((prev) => ({
        heads: prev.heads + newHeads,
        tails: prev.tails + newTails,
        total: prev.total + numCoins,
      }));
      setIsFlipping(false);
    }, 1000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
      {/* Coin Grid */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem", minHeight: "160px", alignItems: "center" }}>
        {coins.map((coin, idx) => (
          <div
            key={idx}
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: coin === "Heads"
                ? "radial-gradient(circle at 35% 35%, #fbbf24, #d97706, #92400e)"
                : "radial-gradient(circle at 35% 35%, #94a3b8, #64748b, #334155)",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3), inset 0 0 0 4px rgba(255,255,255,0.4)",
              transform: isFlipping ? "rotateY(720deg) scale(1.15)" : "rotateY(0deg) scale(1)",
              transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)",
              userSelect: "none",
            }}
          >
            <div style={{ fontSize: "2rem" }}>{coin === "Heads" ? "👑" : "🪙"}</div>
            <div style={{ fontWeight: "800", fontSize: "1rem", letterSpacing: "1px", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
              {coin.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Control Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label style={{ fontWeight: "600", color: "#10213a" }}>Coins to flip:</label>
          {[1, 2, 5, 10].map((c) => (
            <button
              key={c}
              type="button"
              className={numCoins === c ? "" : "secondary"}
              onClick={() => {
                setNumCoins(c);
                setCoins(Array(c).fill("Heads"));
              }}
            >
              {c} {c === 1 ? "Coin" : "Coins"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={flipCoins}
          disabled={isFlipping}
          style={{
            fontSize: "1.2rem",
            fontWeight: "bold",
            padding: "0.85rem 2.5rem",
            background: isFlipping ? "#64748b" : "linear-gradient(135deg, #d97706, #b45309)",
            color: "#ffffff",
            borderRadius: "50px",
            boxShadow: "0 4px 15px rgba(217,119,6,0.4)",
            cursor: isFlipping ? "not-allowed" : "pointer",
          }}
        >
          {isFlipping ? "Flipping Coin..." : "🪙 FLIP COIN!"}
        </button>
      </div>

      {/* Cumulative Stats Card */}
      {stats.total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", width: "100%", maxWidth: "500px", marginTop: "1rem" }}>
          <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", textAlign: "center" }}>
            <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>Total Flips:</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#f8fafc" }}>{stats.total}</div>
          </div>
          <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", textAlign: "center" }}>
            <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>Heads:</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#fbbf24" }}>
              {stats.heads} ({((stats.heads / stats.total) * 100).toFixed(1)}%)
            </div>
          </div>
          <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", textAlign: "center" }}>
            <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>Tails:</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#94a3b8" }}>
              {stats.tails} ({((stats.tails / stats.total) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 3. INTERACTIVE ANIMATED 3D DICE ROLLER ---
function InteractiveDiceRoller() {
  const [numDice, setNumDice] = useState(2);
  const [diceSides, setDiceSides] = useState(6);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState<number[]>([3, 5]);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);

    setTimeout(() => {
      const rolls: number[] = [];
      for (let i = 0; i < numDice; i++) {
        rolls.push(randomInteger(1, diceSides));
      }
      setDiceValues(rolls);
      setIsRolling(false);
    }, 800);
  };

  const totalSum = diceValues.reduce((a, b) => a + b, 0);
  const avg = (totalSum / diceValues.length).toFixed(2);

  // Helper renderer for Dot Pips on standard d6
  const renderDotPips = (val: number) => {
    const pips: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    const active = pips[val] || [4];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", width: "42px", height: "42px" }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: "50%",
              background: active.includes(i) ? "#0f172a" : "transparent",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
      {/* Dice Grid Container */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.25rem", minHeight: "120px", alignItems: "center" }}>
        {diceValues.map((val, idx) => (
          <div
            key={idx}
            style={{
              width: "90px",
              height: "90px",
              borderRadius: diceSides === 6 ? "16px" : "12px",
              background: diceSides === 6
                ? "linear-gradient(145deg, #ffffff, #e2e8f0)"
                : "linear-gradient(145deg, #2563eb, #1d4ed8)",
              color: diceSides === 6 ? "#0f172a" : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.8)",
              border: "2px solid #cbd5e1",
              fontSize: "2rem",
              fontWeight: "bold",
              transform: isRolling ? "rotate(360deg) scale(1.15)" : "rotate(0deg) scale(1)",
              transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
              userSelect: "none",
            }}
          >
            {diceSides === 6 && val <= 6 ? renderDotPips(val) : val}
          </div>
        ))}
      </div>

      {/* Settings Grid */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600" }}>
          Number of Dice:
          <select
            value={numDice}
            onChange={(e) => {
              const n = Number(e.target.value);
              setNumDice(n);
              setDiceValues(Array(n).fill(1));
            }}
            style={{ width: "80px", margin: 0 }}
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600" }}>
          Dice Type:
          <select
            value={diceSides}
            onChange={(e) => {
              const s = Number(e.target.value);
              setDiceSides(s);
              setDiceValues(Array(numDice).fill(1));
            }}
            style={{ width: "130px", margin: 0 }}
          >
            <option value={4}>d4 (4 sides)</option>
            <option value={6}>d6 (Standard)</option>
            <option value={8}>d8 (8 sides)</option>
            <option value={10}>d10 (10 sides)</option>
            <option value={12}>d12 (12 sides)</option>
            <option value={20}>d20 (20 sides)</option>
            <option value={100}>d100 (100 sides)</option>
          </select>
        </label>
      </div>

      {/* Roll Action Button */}
      <button
        type="button"
        onClick={rollDice}
        disabled={isRolling}
        style={{
          fontSize: "1.2rem",
          fontWeight: "bold",
          padding: "0.85rem 2.5rem",
          background: isRolling ? "#64748b" : "linear-gradient(135deg, #10b981, #047857)",
          color: "#ffffff",
          borderRadius: "50px",
          boxShadow: "0 4px 15px rgba(16,185,129,0.4)",
          cursor: isRolling ? "not-allowed" : "pointer",
        }}
      >
        {isRolling ? "Rolling Dice..." : "🎲 ROLL DICE!"}
      </button>

      {/* Result Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", width: "100%", maxWidth: "450px" }}>
        <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", textAlign: "center" }}>
          <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>Total Sum:</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#38bdf8" }}>{totalSum}</div>
        </div>
        <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", textAlign: "center" }}>
          <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>Average Roll:</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#34d399" }}>{avg}</div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN RANDOM & FUN TOOL CLIENT COMPONENT ---
export default function RandomFunToolClient({ tool }: { tool: Tool }) {
  const slug = tool.slug;

  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [minimum, setMinimum] = useState(1);
  const [maximum, setMaximum] = useState(100);
  const [count, setCount] = useState(1);
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [sortNumbers, setSortNumbers] = useState(false);
  const [stringLength, setStringLength] = useState(12);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [nameStyle, setNameStyle] = useState<"brand" | "fantasy" | "person">("person");
  const [teamsCount, setTeamsCount] = useState(2);

  const [result, setResult] = useState<string>("");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [error, setError] = useState("");

  // Direct Interactive Renderers for Interactive Tools
  if (slug === "wheel-spinner") {
    return (
      <section className="workbench">
        <InteractiveWheelSpinner defaultItems={first || "Alex\nSam\nJordan\nTaylor\nMorgan"} />
      </section>
    );
  }

  if (slug === "coin-flip") {
    return (
      <section className="workbench">
        <InteractiveCoinFlipper />
      </section>
    );
  }

  if (slug === "dice-roller") {
    return (
      <section className="workbench">
        <InteractiveDiceRoller />
      </section>
    );
  }

  const run = () => {
    setError("");
    setResult("");
    setSummaryData(null);

    try {
      if (slug === "love-calculator") {
        if (!first.trim() || !second.trim()) throw new Error("Enter both names to calculate love score.");
        const score = stablePercentage(first, second);
        let advice = "Great potential!";
        if (score >= 85) advice = "Soulmates! Outstanding compatibility!";
        else if (score >= 60) advice = "Strong match with great understanding.";
        else if (score >= 40) advice = "Fair match! Takes effort and communication.";
        else advice = "Opposites attract! Keep an open mind.";

        setSummaryData({ score: `${score}%`, advice, names: `${first} & ${second}` });
        setResult(`${first} & ${second} Love Score: ${score}%\nAdvice: ${advice}`);
      } else if (slug === "random-number-generator") {
        const minVal = Math.min(minimum, maximum);
        const maxVal = Math.max(minimum, maximum);
        const qty = Math.min(500, Math.max(1, count));

        if (!allowDuplicates && qty > maxVal - minVal + 1) {
          throw new Error(`Cannot generate ${qty} unique numbers between ${minVal} and ${maxVal}.`);
        }

        const numbers: number[] = [];
        const used = new Set<number>();
        while (numbers.length < qty) {
          const num = randomInteger(minVal, maxVal);
          if (allowDuplicates || !used.has(num)) {
            numbers.push(num);
            used.add(num);
          }
        }

        if (sortNumbers) numbers.sort((a, b) => a - b);
        setSummaryData({ numbers: numbers.join(", "), count: qty, range: `${minVal} to ${maxVal}` });
        setResult(`Random Numbers (${minVal} to ${maxVal}):\n${numbers.join(", ")}`);
      } else if (slug === "yes-or-no-generator") {
        const outcomes = ["Yes", "No", "Definitely Yes", "Definitely No", "Ask Again Later"];
        const chosen = outcomes[randomInteger(0, outcomes.length - 1)];
        setSummaryData({ answer: chosen, question: first.trim() || "Should I do it?" });
        setResult(`Question: ${first.trim() || "General Question"}\nAnswer: ${chosen}`);
      } else if (slug === "random-letter-generator") {
        const qty = Math.min(100, Math.max(1, count));
        let chars = "";
        if (useUpper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (useLower) chars += "abcdefghijklmnopqrstuvwxyz";
        if (!chars) chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        const letters: string[] = [];
        for (let i = 0; i < qty; i++) {
          letters.push(chars[randomInteger(0, chars.length - 1)]);
        }
        setSummaryData({ letters: letters.join(", "), count: qty });
        setResult(`Random Letters: ${letters.join(", ")}`);
      } else if (slug === "random-string-generator") {
        const len = Math.min(256, Math.max(1, stringLength));
        let chars = "";
        if (useUpper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (useLower) chars += "abcdefghijklmnopqrstuvwxyz";
        if (useDigits) chars += "0123456789";
        if (useSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
        if (!chars) chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        const str = Array.from({ length: len }, () => chars[randomInteger(0, chars.length - 1)]).join("");
        setSummaryData({ generatedString: str, length: len });
        setResult(`Generated String (${len} chars):\n${str}`);
      } else if (slug === "couple-name-combiner") {
        if (!first.trim() || !second.trim()) throw new Error("Enter both names to combine.");
        const f = first.trim();
        const s = second.trim();
        const combo1 = f.slice(0, Math.ceil(f.length / 2)) + s.slice(Math.floor(s.length / 2));
        const combo2 = s.slice(0, Math.ceil(s.length / 2)) + f.slice(Math.floor(f.length / 2));
        const combo3 = f.slice(0, Math.floor(f.length / 2)) + s;
        const combo4 = s.slice(0, Math.floor(s.length / 2)) + f;

        const combos = [...new Set([combo1, combo2, combo3, combo4])];
        setSummaryData({ combinations: combos.join(", "), primary: combo1 });
        setResult(`Couple Name Suggestions:\n1. ${combo1}\n2. ${combo2}\n3. ${combo3}\n4. ${combo4}`);
      } else if (slug === "random-name-picker") {
        const items = parseLines(first);
        if (!items.length) throw new Error("Enter at least one item or name.");
        const winnerName = pickRandom(items);
        setSummaryData({ winner: winnerName, totalCandidates: items.length });
        setResult(`Selected Winner: ${winnerName}\nOut of ${items.length} total entries.`);
      } else if (slug === "random-team-generator") {
        const items = parseLines(first);
        if (items.length < 2) throw new Error("Enter at least two player names.");
        const numTeams = Math.max(2, teamsCount);
        const shuffledItems = shuffled(items);

        const teams: string[][] = Array.from({ length: numTeams }, () => []);
        shuffledItems.forEach((item, idx) => teams[idx % numTeams].push(item));

        const teamList = teams.map((t, i) => `Team ${i + 1} (${t.length}): ${t.join(", ")}`);
        setSummaryData({ teams: teamList, totalPlayers: items.length });
        setResult(`Random Teams:\n${teamList.join("\n")}`);
      } else if (slug === "secret-santa-generator") {
        const people = parseLines(first);
        if (people.length < 2) throw new Error("Enter at least two participants.");
        const participants = shuffled(people);
        const recipients = [...participants.slice(1), participants[0]];
        const pairs = participants.map((p, i) => `${p} 🎁 ➔ ${recipients[i]}`);

        setSummaryData({ pairs, count: people.length });
        setResult(`Secret Santa Assignments:\n${pairs.join("\n")}`);
      } else if (slug === "numerology-calculator") {
        if (!first.trim()) throw new Error("Enter a name or phrase.");
        const total = [...first.toLowerCase()].reduce(
          (sum, char) => sum + Math.max(0, char.charCodeAt(0) - 96),
          0
        );
        const num = total === 0 ? 0 : 1 + ((total - 1) % 9);
        const meanings: Record<number, string> = {
          1: "Leader, Independent, Ambitious",
          2: "Diplomatic, Harmonious, Sensitive",
          3: "Creative, Expressive, Joyful",
          4: "Practical, Disciplined, Stable",
          5: "Free-spirited, Adventurous, Dynamic",
          6: "Nurturing, Responsible, Loving",
          7: "Analytical, Intuitive, Philosophical",
          8: "Authoritative, Successful, Powerful",
          9: "Humanitarian, Compassionate, Wise",
        };

        setSummaryData({ number: num, meaning: meanings[num] || "Harmonious", totalSum: total });
        setResult(`Numerology Number: ${num}\nMeaning: ${meanings[num] || "Harmonious"}\nSum: ${total}`);
      } else if (slug === "zodiac-sign-finder") {
        if (!first) throw new Error("Select or enter a valid date of birth.");
        const date = new Date(first);
        if (Number.isNaN(date.valueOf())) throw new Error("Invalid birth date.");

        const month = date.getUTCMonth();
        const day = date.getUTCDate();

        const signs = [
          "Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini",
          "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"
        ];
        const cutoffs = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
        const sign = signs[day >= cutoffs[month] ? (month + 1) % 12 : month];

        const elements: Record<string, string> = {
          Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
          Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
          Gemini: "Air", Libra: "Air", Aquarius: "Air",
          Cancer: "Water", Scorpio: "Water", Pisces: "Water",
        };

        setSummaryData({ sign, element: elements[sign] || "Universal", birthDate: date.toDateString() });
        setResult(`Zodiac Sign: ${sign}\nElement: ${elements[sign] || "Universal"}\nBirth Date: ${date.toDateString()}`);
      } else {
        const qty = Math.min(50, Math.max(1, count));
        const activeStyle = slug.includes("business") || slug.includes("brand")
          ? "brand"
          : slug.includes("fantasy")
          ? "fantasy"
          : nameStyle;

        const names = Array.from({ length: qty }, () => generatedName(activeStyle));
        setSummaryData({ names, count: qty, category: activeStyle });
        setResult(`Generated Names (${qty}):\n${names.join("\n")}`);
      }
    } catch (caught) {
      setResult("");
      setSummaryData(null);
      setError(caught instanceof Error ? caught.message : "Could not generate result.");
    }
  };

  return (
    <section className="workbench">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Input Parameters Form */}
        {slug === "love-calculator" || slug === "couple-name-combiner" ? (
          <div className="input-grid">
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              First Name
              <input type="text" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="e.g. Alex" />
            </label>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Second Name
              <input type="text" value={second} onChange={(e) => setSecond(e.target.value)} placeholder="e.g. Jordan" />
            </label>
          </div>
        ) : slug === "random-number-generator" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="input-grid">
              <label style={{ color: "#10213a", fontWeight: "600" }}>
                Minimum Value
                <input type="number" value={minimum} onChange={(e) => setMinimum(Number(e.target.value))} />
              </label>
              <label style={{ color: "#10213a", fontWeight: "600" }}>
                Maximum Value
                <input type="number" value={maximum} onChange={(e) => setMaximum(Number(e.target.value))} />
              </label>
              <label style={{ color: "#10213a", fontWeight: "600" }}>
                Quantity of Numbers
                <input type="number" min="1" max="500" value={count} onChange={(e) => setCount(Number(e.target.value))} />
              </label>
            </div>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10213a", fontWeight: "500" }}>
                <input type="checkbox" checked={allowDuplicates} onChange={(e) => setAllowDuplicates(e.target.checked)} />
                Allow Duplicate Numbers
              </label>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10213a", fontWeight: "500" }}>
                <input type="checkbox" checked={sortNumbers} onChange={(e) => setSortNumbers(e.target.checked)} />
                Sort Numbers Ascending
              </label>
            </div>
          </div>
        ) : slug === "random-string-generator" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              String Length
              <input type="number" min="1" max="256" value={stringLength} onChange={(e) => setStringLength(Number(e.target.value))} />
            </label>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#10213a", fontWeight: "500" }}>
                <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} /> Uppercase (A-Z)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#10213a", fontWeight: "500" }}>
                <input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} /> Lowercase (a-z)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#10213a", fontWeight: "500" }}>
                <input type="checkbox" checked={useDigits} onChange={(e) => setUseDigits(e.target.checked)} /> Digits (0-9)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#10213a", fontWeight: "500" }}>
                <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} /> Symbols (!@#$)
              </label>
            </div>
          </div>
        ) : slug === "random-name-picker" || slug === "random-team-generator" || slug === "secret-santa-generator" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label className="workbench-label" style={{ color: "#10213a", fontWeight: "700" }}>
              Items / Names List (One per line or comma-separated)
            </label>
            <textarea
              rows={5}
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="Alex&#10;Sam&#10;Jordan&#10;Taylor&#10;Morgan"
            />
            {slug === "random-team-generator" && (
              <label style={{ width: "200px", color: "#10213a", fontWeight: "600" }}>
                Number of Teams
                <input type="number" min="2" max="20" value={teamsCount} onChange={(e) => setTeamsCount(Number(e.target.value))} />
              </label>
            )}
          </div>
        ) : slug === "zodiac-sign-finder" ? (
          <label style={{ color: "#10213a", fontWeight: "600" }}>
            Select Date of Birth
            <input type="date" value={first} onChange={(e) => setFirst(e.target.value)} />
          </label>
        ) : slug === "numerology-calculator" || slug === "yes-or-no-generator" ? (
          <label style={{ color: "#10213a", fontWeight: "600" }}>
            {slug === "yes-or-no-generator" ? "Ask a Question (Optional)" : "Full Name or Phrase"}
            <input type="text" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Type here..." />
          </label>
        ) : (
          <div className="input-grid">
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Name Style / Category
              <select value={nameStyle} onChange={(e) => setNameStyle(e.target.value as any)}>
                <option value="person">Person Names</option>
                <option value="brand">Brand & Business Names</option>
                <option value="fantasy">Fantasy & Gamer Names</option>
              </select>
            </label>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Number of Names to Generate
              <input type="number" min="1" max="50" value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </label>
          </div>
        )}

        {/* Action Button */}
        <button type="button" onClick={run} style={{ marginTop: "0.5rem" }}>
          Run {tool.name}
        </button>

        {error && <div style={{ color: "#ef4444", padding: "0.5rem", fontWeight: "bold" }}>{error}</div>}

        {/* RESULT BOX WITH CRYSTAL CLEAR HIGH CONTRAST TEXT */}
        {result && (
          <div className="result" style={{ marginTop: "1.5rem", padding: "1.25rem", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <strong style={{ fontSize: "1.2rem", color: "var(--text-color, #0f172a)" }}>Result Summary</strong>
              <button
                className="secondary"
                type="button"
                onClick={() => navigator.clipboard.writeText(result)}
              >
                Copy Result
              </button>
            </div>

            {/* Formatted summary cards if available */}
            {summaryData && summaryData.score && (
              <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ padding: "1rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", textAlign: "center" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>{summaryData.names}</div>
                  <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#ec4899" }}>{summaryData.score}</div>
                  <div style={{ color: "#f8fafc", fontSize: "1.05rem", marginTop: "0.25rem" }}>{summaryData.advice}</div>
                </div>
              </div>
            )}

            {summaryData && summaryData.winner && (
              <div style={{ padding: "1rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", marginBottom: "1rem" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Selected Winner:</div>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#38bdf8" }}>🎉 {summaryData.winner}</div>
              </div>
            )}

            {summaryData && summaryData.sign && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>Zodiac Sign:</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#38bdf8" }}>✨ {summaryData.sign}</div>
                </div>
                <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>Element:</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#34d399" }}>🔥 {summaryData.element}</div>
                </div>
              </div>
            )}

            {summaryData && summaryData.number !== undefined && (
              <div style={{ padding: "1rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", marginBottom: "1rem" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>Numerology Number:</div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#a855f7" }}>{summaryData.number}</div>
                <div style={{ color: "#f8fafc", fontSize: "1rem", marginTop: "0.25rem" }}>{summaryData.meaning}</div>
              </div>
            )}

            <pre
              style={{
                background: "#0f172a",
                color: "#f8fafc",
                padding: "1rem",
                borderRadius: "8px",
                fontSize: "1.05rem",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                border: "1px solid #334155",
                lineHeight: "1.5",
              }}
            >
              {result}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
