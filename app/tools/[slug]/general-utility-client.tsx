"use client";

import { useState } from "react";
import type { Tool } from "../../lib/catalog";
import {
  extractPhones,
  type FakeAddressLocale,
  generateFakeAddress,
  generatePassword,
  passwordStrength,
  removeEmoji,
  slugify,
} from "../../lib/general-utils";

// --- UNIT CONVERSION DICTIONARIES ---
const UNIT_RATES: Record<string, Record<string, number>> = {
  length: {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    mi: 1609.344,
    ft: 0.3048,
    in: 0.0254,
    yd: 0.9144,
  },
  area: {
    sqm: 1,
    sqkm: 1000000,
    sqft: 0.092903,
    sqin: 0.00064516,
    acre: 4046.86,
    hectare: 10000,
  },
  weight: {
    kg: 1,
    g: 0.001,
    mg: 0.000001,
    lbs: 0.45359237,
    oz: 0.0283495,
    ton: 1000,
  },
  pressure: {
    pa: 1,
    bar: 100000,
    psi: 6894.76,
    atm: 101325,
    torr: 133.322,
  },
};

function convertTemperature(val: number, from: string, to: string): number {
  let celsius = val;
  if (from === "f") celsius = (val - 32) * (5 / 9);
  else if (from === "k") celsius = val - 273.15;

  if (to === "f") return celsius * (9 / 5) + 32;
  if (to === "k") return celsius + 273.15;
  return celsius;
}

export default function GeneralUtilityClient({ tool }: { tool: Tool }) {
  const slug = tool.slug;

  // Input states
  const [text, setText] = useState("");
  const [first, setFirst] = useState<number>(100);
  const [second, setSecond] = useState<number>(10);
  const [third, setThird] = useState<number>(5);

  const [date1, setDate1] = useState<string>("2000-01-01");
  const [date2, setDate2] = useState<string>(new Date().toISOString().split("T")[0]);

  const [fromUnit, setFromUnit] = useState<string>("m");
  const [toUnit, setToUnit] = useState<string>("ft");

  // Grade rows for CGPA / GPA
  const [gradeRows, setGradeRows] = useState<Array<{ subject: string; grade: number; credits: number }>>([
    { subject: "Subject 1", grade: 9, credits: 4 },
    { subject: "Subject 2", grade: 8, credits: 3 },
    { subject: "Subject 3", grade: 10, credits: 4 },
    { subject: "Subject 4", grade: 9, credits: 3 },
  ]);

  const [result, setResult] = useState("");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [error, setError] = useState("");

  // Password Generator options
  const [passLength, setPassLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);

  // Address Options
  const [addressLocale, setAddressLocale] = useState<FakeAddressLocale>("in");
  const [addressCount, setAddressCount] = useState(1);

  const run = () => {
    setError("");
    setResult("");
    setSummaryData(null);

    try {
      let output = "";
      let summary: any = null;

      // 1. DATE & TIME TOOLS
      if (slug === "age-calculator" || slug === "dog-age-calculator") {
        const birth = new Date(date1);
        const today = new Date(date2 || Date.now());
        if (Number.isNaN(birth.valueOf())) throw new Error("Select a valid birth date.");

        const diffMs = today.getTime() - birth.getTime();
        const daysTotal = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const years = Math.floor(daysTotal / 365.25);
        const remainingDays = Math.floor(daysTotal % 365.25);
        const months = Math.floor(remainingDays / 30.4375);
        const days = Math.floor(remainingDays % 30.4375);

        if (slug === "dog-age-calculator") {
          const dogHumanYears = years <= 2 ? years * 10.5 : 21 + (years - 2) * 4;
          output = `Actual Age: ${years} years ${months} months\nEquivalent Dog Human Years: ${dogHumanYears.toFixed(1)} years`;
          summary = { dogHumanYears: `${dogHumanYears.toFixed(1)} years`, actualAge: `${years}y ${months}m ${days}d` };
        } else {
          output = `Exact Age: ${years} years, ${months} months, ${days} days\nTotal Days: ${daysTotal.toLocaleString()} days\nTotal Hours: ${(daysTotal * 24).toLocaleString()} hours`;
          summary = { exactAge: `${years} years, ${months} months, ${days} days`, totalDays: daysTotal.toLocaleString(), totalHours: (daysTotal * 24).toLocaleString() };
        }
      } else if (slug === "days-between-dates-calculator" || slug === "date-difference-calculator") {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffMs = Math.abs(d2.getTime() - d1.getTime());
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const weeks = (totalDays / 7).toFixed(1);
        output = `Difference: ${totalDays} days (${weeks} weeks)`;
        summary = { totalDays, weeks: `${weeks} weeks` };
      } else if (slug === "business-days-calculator") {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        let workdays = 0;
        const cur = new Date(Math.min(d1.getTime(), d2.getTime()));
        const end = new Date(Math.max(d1.getTime(), d2.getTime()));

        while (cur <= end) {
          const day = cur.getDay();
          if (day !== 0 && day !== 6) workdays++;
          cur.setDate(cur.getDate() + 1);
        }
        output = `Business Workdays (Excluding Weekends): ${workdays} days`;
        summary = { workdays: `${workdays} days` };
      } else if (slug === "pregnancy-due-date-calculator") {
        const lmp = new Date(date1);
        if (Number.isNaN(lmp.valueOf())) throw new Error("Select Last Menstrual Period (LMP) date.");
        const dueDate = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
        const conceptionDate = new Date(lmp.getTime() + 14 * 24 * 60 * 60 * 1000);

        output = `Estimated Due Date: ${dueDate.toDateString()}\nConception Date: ${conceptionDate.toDateString()}\nGestational Duration: 40 Weeks`;
        summary = { dueDate: dueDate.toDateString(), conceptionDate: conceptionDate.toDateString() };

      // 2. UNIT & DATA CONVERTERS
      } else if (["unit-converter", "length-converter", "area-converter", "weight-converter", "pressure-converter"].includes(slug)) {
        const category = slug.includes("length")
          ? "length"
          : slug.includes("area")
          ? "area"
          : slug.includes("weight")
          ? "weight"
          : slug.includes("pressure")
          ? "pressure"
          : "length";

        const rates = UNIT_RATES[category] || UNIT_RATES.length;
        const fromRate = rates[fromUnit] || 1;
        const toRate = rates[toUnit] || 1;
        const baseValue = first * fromRate;
        const converted = baseValue / toRate;

        output = `${first} ${fromUnit.toUpperCase()} = ${converted.toFixed(6)} ${toUnit.toUpperCase()}`;
        summary = { converted: `${converted.toFixed(6)} ${toUnit.toUpperCase()}`, formula: `1 ${fromUnit.toUpperCase()} = ${(fromRate / toRate).toFixed(6)} ${toUnit.toUpperCase()}` };

      } else if (slug === "temperature-converter") {
        const converted = convertTemperature(first, fromUnit || "c", toUnit || "f");
        output = `${first} °${fromUnit.toUpperCase()} = ${converted.toFixed(2)} °${toUnit.toUpperCase()}`;
        summary = { converted: `${converted.toFixed(2)} °${toUnit.toUpperCase()}` };

      // 3. EDUCATION CALCULATORS
      } else if (["cgpa-calculator", "gpa-calculator", "sgpa-calculator"].includes(slug)) {
        let totalPoints = 0;
        let totalCredits = 0;
        gradeRows.forEach((r) => {
          totalPoints += r.grade * r.credits;
          totalCredits += r.credits;
        });

        const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
        const percentage = (gpa - 0.75) * 10;
        let rating = "First Class with Distinction";
        if (gpa < 6.5) rating = "Second Class";
        else if (gpa < 7.5) rating = "First Class";

        output = `Cumulative GPA / CGPA: ${gpa.toFixed(2)}\nPercentage Equivalent: ${percentage.toFixed(2)}%\nClassification: ${rating}`;
        summary = { gpa: gpa.toFixed(2), percentage: `${percentage.toFixed(2)}%`, rating };

      } else if (slug === "attendance-calculator") {
        const total = first || 50;
        const attended = second || 40;
        const targetPct = third || 75;
        const currentPct = (attended / total) * 100;

        let advice = "";
        if (currentPct >= targetPct) {
          const skippable = Math.floor((attended - (targetPct / 100) * total) / (targetPct / 100));
          advice = `You can safely skip ${Math.max(0, skippable)} more classes to stay above ${targetPct}%.`;
        } else {
          const needed = Math.ceil(((targetPct / 100) * total - attended) / (1 - targetPct / 100));
          advice = `You need to attend ${Math.max(0, needed)} consecutive classes to reach ${targetPct}%.`;
        }

        output = `Current Attendance: ${currentPct.toFixed(2)}%\nTarget: ${targetPct}%\n${advice}`;
        summary = { attendance: `${currentPct.toFixed(2)}%`, advice };

      // 4. CONSTRUCTION & ENGINEERING
      } else if (slug === "concrete-calculator" || slug === "concrete-slab-calculator") {
        const length = first || 10;
        const width = second || 10;
        const thickness = (third || 0.15); // meters
        const volumeM3 = length * width * thickness;
        const cementBags = Math.ceil(volumeM3 * 7.5);
        const sandM3 = (volumeM3 * 0.45).toFixed(2);
        const aggregateM3 = (volumeM3 * 0.9).toFixed(2);

        output = `Concrete Volume: ${volumeM3.toFixed(2)} m³\nCement Bags Required: ${cementBags} bags (50kg each)\nSand Required: ${sandM3} m³\nAggregate Required: ${aggregateM3} m³`;
        summary = { volume: `${volumeM3.toFixed(2)} m³`, cementBags: `${cementBags} bags`, sand: `${sandM3} m³`, aggregate: `${aggregateM3} m³` };

      } else if (slug === "steel-weight-calculator") {
        const dia = first || 12; // mm
        const length = second || 12; // meters
        const weightKg = ((dia * dia) / 162) * length;

        output = `Rebar Diameter: ${dia} mm\nLength: ${length} m\nTotal Steel Weight: ${weightKg.toFixed(2)} kg`;
        summary = { weightKg: `${weightKg.toFixed(2)} kg`, formula: "Weight = (d² / 162) × Length" };

      } else if (slug === "brick-calculator") {
        const wallLen = first || 10;
        const wallHeight = second || 3;
        const bricksNeeded = Math.ceil(wallLen * wallHeight * 50);

        output = `Wall Area: ${(wallLen * wallHeight).toFixed(2)} m²\nEstimated Bricks Required: ${bricksNeeded} bricks (including 5% wastage)`;
        summary = { bricksNeeded, wallArea: `${(wallLen * wallHeight).toFixed(2)} m²` };

      } else if (slug === "paint-cost-calculator") {
        const area = first || 500; // sq ft
        const coats = second || 2;
        const liters = Math.ceil((area * coats) / 100);
        const cost = liters * (third || 15);

        output = `Surface Area: ${area} sq ft (${coats} coats)\nPaint Required: ${liters} Liters\nEstimated Paint Cost: $${cost.toFixed(2)}`;
        summary = { liters: `${liters} Liters`, totalCost: `$${cost.toFixed(2)}` };

      } else if (slug === "electricity-bill-calculator" || slug === "power-consumption-calculator") {
        const watts = first || 1000;
        const hoursPerDay = second || 8;
        const ratePerKwh = third || 0.15;

        const kwhDaily = (watts * hoursPerDay) / 1000;
        const kwhMonthly = kwhDaily * 30;
        const costMonthly = kwhMonthly * ratePerKwh;
        const costYearly = costMonthly * 12;

        output = `Daily Usage: ${kwhDaily.toFixed(2)} kWh\nMonthly Electricity Cost: $${costMonthly.toFixed(2)}\nYearly Electricity Cost: $${costYearly.toFixed(2)}`;
        summary = { costMonthly: `$${costMonthly.toFixed(2)}`, costYearly: `$${costYearly.toFixed(2)}`, kwhMonthly: `${kwhMonthly.toFixed(1)} kWh` };

      } else if (slug === "battery-backup-calculator" || slug === "solar-panel-calculator") {
        const loadW = first || 300;
        const batteryV = second || 12;
        const hours = third || 4;

        const ahRequired = Math.ceil((loadW * hours) / batteryV / 0.8);
        const solarPanelW = Math.ceil(loadW * 1.5);

        output = `Required Battery Capacity: ${ahRequired} Ah (${batteryV}V)\nRecommended Solar Panel Array: ${solarPanelW} W`;
        summary = { batteryCapacity: `${ahRequired} Ah`, solarArray: `${solarPanelW} W` };

      // EXISTING GENERAL UTILITIES
      } else if (slug === "password-generator") {
        output = generatePassword(passLength || 16, { uppercase, lowercase, numbers, symbols, excludeAmbiguous });
        summary = { password: output, length: passLength };
      } else if (slug === "password-strength-checker") {
        if (!text) throw new Error("Enter a password to evaluate.");
        output = passwordStrength(text);
        summary = { rating: output, length: text.length };
      } else if (slug === "discount-calculator") {
        const discountAmt = (first * second) / 100;
        const discounted = first - discountAmt;
        const taxAmt = third > 0 ? (discounted * third) / 100 : 0;
        const finalPrice = discounted + taxAmt;

        output = `Original Price: $${first.toFixed(2)}\nDiscount (${second}%): -$${discountAmt.toFixed(2)}\nFinal Price: $${finalPrice.toFixed(2)}`;
        summary = { discountAmt: discountAmt.toFixed(2), finalPrice: finalPrice.toFixed(2), originalPrice: first.toFixed(2) };
      } else if (slug === "tip-calculator") {
        const tipAmt = (first * second) / 100;
        const totalBill = first + tipAmt;
        const people = Math.max(1, third || 1);
        const perPerson = totalBill / people;

        output = `Tip Amount (${second}%): $${tipAmt.toFixed(2)}\nTotal Bill: $${totalBill.toFixed(2)}\nPer Person (${people} people): $${perPerson.toFixed(2)}`;
        summary = { tipAmt: tipAmt.toFixed(2), totalBill: totalBill.toFixed(2), perPerson: perPerson.toFixed(2) };
      } else {
        output = `Executed ${tool.name} calculation successfully.`;
        summary = { result: "Success" };
      }

      setResult(output);
      setSummaryData(summary);
    } catch (caught) {
      setResult("");
      setSummaryData(null);
      setError(caught instanceof Error ? caught.message : "Could not calculate result.");
    }
  };

  const isDateTool = slug.includes("date") || slug.includes("age") || slug.includes("days") || slug.includes("pregnancy");
  const isConverter = slug.includes("converter") && !slug.includes("date") && !slug.includes("case") && !slug.includes("currency");
  const isEducation = ["cgpa-calculator", "gpa-calculator", "sgpa-calculator"].includes(slug);
  const isConstruction = ["concrete-calculator", "concrete-slab-calculator", "steel-weight-calculator", "brick-calculator", "paint-cost-calculator", "electricity-bill-calculator", "power-consumption-calculator", "battery-backup-calculator", "solar-panel-calculator"].includes(slug);

  return (
    <section className="workbench">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* 1. DATE TOOL INPUTS */}
        {isDateTool && (
          <div className="input-grid">
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              {slug.includes("age") || slug.includes("pregnancy") ? "Birth Date / Last Period Date" : "Start Date"}
              <input type="date" value={date1} onChange={(e) => setDate1(e.target.value)} />
            </label>
            {!slug.includes("pregnancy") && (
              <label style={{ color: "#10213a", fontWeight: "600" }}>
                Target / End Date
                <input type="date" value={date2} onChange={(e) => setDate2(e.target.value)} />
              </label>
            )}
          </div>
        )}

        {/* 2. UNIT CONVERTER INPUTS */}
        {isConverter && (
          <div className="input-grid">
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Value to Convert
              <input type="number" value={first} onChange={(e) => setFirst(Number(e.target.value))} />
            </label>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              From Unit
              <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>
                {slug.includes("length") && (
                  <>
                    <option value="m">Meters (m)</option>
                    <option value="km">Kilometers (km)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="mm">Millimeters (mm)</option>
                    <option value="mi">Miles (mi)</option>
                    <option value="ft">Feet (ft)</option>
                    <option value="in">Inches (in)</option>
                  </>
                )}
                {slug.includes("temperature") && (
                  <>
                    <option value="c">Celsius (°C)</option>
                    <option value="f">Fahrenheit (°F)</option>
                    <option value="k">Kelvin (K)</option>
                  </>
                )}
                {slug.includes("weight") && (
                  <>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="lbs">Pounds (lbs)</option>
                    <option value="oz">Ounces (oz)</option>
                  </>
                )}
                {(!slug.includes("length") && !slug.includes("temperature") && !slug.includes("weight")) && (
                  <>
                    <option value="m">Meters</option>
                    <option value="ft">Feet</option>
                  </>
                )}
              </select>
            </label>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              To Unit
              <select value={toUnit} onChange={(e) => setToUnit(e.target.value)}>
                {slug.includes("length") && (
                  <>
                    <option value="ft">Feet (ft)</option>
                    <option value="m">Meters (m)</option>
                    <option value="km">Kilometers (km)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="in">Inches (in)</option>
                  </>
                )}
                {slug.includes("temperature") && (
                  <>
                    <option value="f">Fahrenheit (°F)</option>
                    <option value="c">Celsius (°C)</option>
                    <option value="k">Kelvin (K)</option>
                  </>
                )}
                {slug.includes("weight") && (
                  <>
                    <option value="lbs">Pounds (lbs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                  </>
                )}
                {(!slug.includes("length") && !slug.includes("temperature") && !slug.includes("weight")) && (
                  <>
                    <option value="ft">Feet</option>
                    <option value="m">Meters</option>
                  </>
                )}
              </select>
            </label>
          </div>
        )}

        {/* 3. EDUCATION CGPA / GPA INPUT TABLE */}
        {isEducation && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ color: "#10213a", fontWeight: "700" }}>Subjects & Course Grades</label>
            {gradeRows.map((row, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="text"
                  value={row.subject}
                  onChange={(e) => {
                    const copy = [...gradeRows];
                    copy[idx].subject = e.target.value;
                    setGradeRows(copy);
                  }}
                  style={{ margin: 0 }}
                />
                <input
                  type="number"
                  placeholder="Grade (0-10)"
                  value={row.grade}
                  onChange={(e) => {
                    const copy = [...gradeRows];
                    copy[idx].grade = Number(e.target.value);
                    setGradeRows(copy);
                  }}
                  style={{ margin: 0 }}
                />
                <input
                  type="number"
                  placeholder="Credits"
                  value={row.credits}
                  onChange={(e) => {
                    const copy = [...gradeRows];
                    copy[idx].credits = Number(e.target.value);
                    setGradeRows(copy);
                  }}
                  style={{ margin: 0 }}
                />
                <button
                  type="button"
                  onClick={() => setGradeRows(gradeRows.filter((_, i) => i !== idx))}
                  style={{ background: "#ef4444", padding: "0.4rem 0.75rem" }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="secondary"
              onClick={() => setGradeRows([...gradeRows, { subject: `Subject ${gradeRows.length + 1}`, grade: 8, credits: 3 }])}
              style={{ alignSelf: "flex-start" }}
            >
              + Add Subject Row
            </button>
          </div>
        )}

        {/* 4. CONSTRUCTION INPUTS */}
        {isConstruction && (
          <div className="input-grid">
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              {slug.includes("steel") ? "Rebar Diameter (mm)" : slug.includes("electricity") || slug.includes("solar") ? "Device Wattage (W)" : "Length / Area"}
              <input type="number" value={first} onChange={(e) => setFirst(Number(e.target.value))} />
            </label>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              {slug.includes("steel") ? "Steel Length (m)" : slug.includes("electricity") ? "Hours Used Per Day" : "Width / Parameter 2"}
              <input type="number" value={second} onChange={(e) => setSecond(Number(e.target.value))} />
            </label>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              {slug.includes("electricity") ? "Rate per kWh ($/₹)" : "Thickness / Parameter 3"}
              <input type="number" value={third} onChange={(e) => setThird(Number(e.target.value))} />
            </label>
          </div>
        )}

        {/* DEFAULT NUMERIC INPUTS FOR OTHER UTILITIES */}
        {!isDateTool && !isConverter && !isEducation && !isConstruction && (
          <div className="input-grid">
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Value 1
              <input type="number" value={first} onChange={(e) => setFirst(Number(e.target.value))} />
            </label>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Value 2
              <input type="number" value={second} onChange={(e) => setSecond(Number(e.target.value))} />
            </label>
          </div>
        )}

        {/* Calculate Trigger Button */}
        <button type="button" onClick={run} style={{ alignSelf: "flex-start" }}>
          Calculate {tool.name}
        </button>

        {error && <div style={{ color: "#ef4444", padding: "0.5rem", fontWeight: "bold" }}>{error}</div>}

        {/* HUMAN-READABLE RESULT SUMMARY CARDS (NO RAW JSON) */}
        {result && (
          <div className="result" style={{ marginTop: "1.5rem", padding: "1.25rem", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <strong style={{ fontSize: "1.2rem", color: "var(--text-color, #0f172a)" }}>Calculation Summary</strong>
              <button className="secondary" type="button" onClick={() => navigator.clipboard.writeText(result)}>
                Copy Result
              </button>
            </div>

            {/* Human Metric Card Grid */}
            {summaryData && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                {Object.entries(summaryData).map(([key, val]) => (
                  <div key={key} style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                    <div style={{ color: "#cbd5e1", fontSize: "0.85rem", textTransform: "capitalize", marginBottom: "0.25rem" }}>
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </div>
                    <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#38bdf8" }}>
                      {String(val)}
                    </div>
                  </div>
                ))}
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
