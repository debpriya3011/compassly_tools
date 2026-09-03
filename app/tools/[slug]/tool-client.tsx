"use client";

import { useState } from "react";
import type { Tool } from "../../lib/catalog";
import { workflowGroupFor } from "../../lib/workflow-routing";
import ColorToolClient from "./color-tool-client";
import CsvToExcelClient from "./csv-to-excel-client";
import DeveloperToolClient from "./developer-tool-client";
import GeneralUtilityClient from "./general-utility-client";
import FinanceToolClient from "./finance-tool-client";
import ImageCompressorClient from "./image-compressor-client";
import PdfToolClient from "./pdf-tool-client";
import QrBarcodeToolClient from "./qr-barcode-tool-client";
import RandomFunToolClient from "./random-fun-tool-client";
import ServerFileToolClient from "./server-file-tool-client";
import TextToolClient from "./text-tool-client";
import MathToolClient from "./math-tool-client";

import ImageToolClient from "./image-tool-client";

function GenericTool({ tool }: { tool: Tool }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState("");
  return (
    <section className="workbench">
      <label className="workbench-label" htmlFor="generic-input">
        Input
      </label>
      <textarea
        id="generic-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Enter a value…"
      />
      <button
        type="button"
        onClick={() => setResult(value || "Enter a value first.")}
      >
        Run {tool.name}
      </button>
      {result && (
        <div className="result">
          <strong>Result</strong>
          <pre>{result}</pre>
          <button
            className="secondary"
            type="button"
            onClick={() => navigator.clipboard.writeText(result)}
          >
            Copy result
          </button>
        </div>
      )}
    </section>
  );
}

export default function ToolClient({ tool }: { tool: Tool }) {
  switch (workflowGroupFor(tool)) {
    case "csv-to-excel":
      return <CsvToExcelClient />;
    case "image-compressor":
    case "image":
      return <ImageToolClient tool={tool} />;
    case "pdf":
      return <PdfToolClient tool={tool} />;
    case "qr-barcode":
      return <QrBarcodeToolClient tool={tool} />;
    case "color":
      return <ColorToolClient tool={tool} />;
    case "random-fun":
      return <RandomFunToolClient tool={tool} />;
    case "general":
      return <GeneralUtilityClient tool={tool} />;
    case "developer":
      return <DeveloperToolClient tool={tool} />;
    case "text":
      return <TextToolClient tool={tool} />;
    case "finance":
      return <FinanceToolClient tool={tool} />;
    case "math":
      return <MathToolClient tool={tool} />;
    default:
      if (tool.category === "Video Tools" || tool.category === "Audio Tools")
        return <ServerFileToolClient tool={tool} />;
      return <GenericTool tool={tool} />;
  }
}
