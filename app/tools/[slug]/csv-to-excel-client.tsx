"use client";
import { useState } from "react";
type Cell = string | number | boolean | null;
export default function CsvToExcelClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Cell[][]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const convert = async () => {
    if (!file) return setStatus("Choose a CSV file first.");
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv")
      return setStatus("Please upload a .csv file.");
    setBusy(true);
    setStatus("");
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.text(), {
        type: "string",
        raw: true,
      });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, {
        header: 1,
        defval: "",
      });
      if (!rows.length) throw new Error("The CSV is empty.");
      setPreview(rows.slice(0, 6));
      XLSX.writeFile(
        workbook,
        `${file.name.replace(/\.csv$/i, "") || "converted"}.xlsx`,
        { compression: true },
      );
      setStatus(
        `Converted ${rows.length.toLocaleString()} rows. Your Excel download has started.`,
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "We could not convert this CSV file.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="workbench">
      <div className="workbench-label">Upload CSV file</div>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => {
          setFile(e.target.files?.[0] || null);
          setPreview([]);
          setStatus("");
        }}
      />
      <button onClick={convert} disabled={busy}>
        {busy ? "Converting…" : "Convert to Excel"}
      </button>
      {status && (
        <div className="result">
          <strong>Conversion status</strong>
          <p>{status}</p>
        </div>
      )}
      {preview.length > 0 && (
        <div className="preview">
          <strong>Preview (first 6 rows)</strong>
          <div className="table-wrap">
            <table>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="privacy-note">
        Your CSV is converted locally in your browser and is not uploaded to a
        server.
      </p>
    </section>
  );
}
