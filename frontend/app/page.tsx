"use client";

import { useState, useCallback } from "react";
import StepIndicator from "./components/StepIndicator";
import UploadZone from "./components/UploadZone";
import PreviewTable from "./components/PreviewTable";
import LoadingOverlay from "./components/LoadingOverlay";
import ResultTable from "./components/ResultTable";
import type { ImportResult, ApiResponse } from "./types/crm";

// Config
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const BATCH_SIZE = 20;

// Lightweight CSV parser (no external deps)
function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleaned = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // strip BOM
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === "," && !inQuote) {
        result.push(cur.trim()); cur = "";
      } else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseRow(lines[0]!).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]!);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
    rows.push(row);
  }
  return { headers, rows };
}

// Types
type Step = 1 | 2 | 3 | 4;
interface CsvData { headers: string[]; rows: Record<string, string>[]; }

// Component
export default function HomePage() {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processedBatches, setProcessedBatches] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  // Step 1 → 2
  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsvText(text);
      if (rows.length === 0) {
        setError("Could not parse the CSV file — it appears empty or invalid.");
        return;
      }
      setCsvData({ headers, rows });
      setStep(2);
    };
    reader.onerror = () => setError("Failed to read file. Please try again.");
    reader.readAsText(selectedFile);
  }, []);

  // Step 2 → 3 → 4
  const handleConfirmImport = useCallback(async () => {
    if (!file || !csvData) return;

    setError(null);
    setStep(3);

    const batches = Math.ceil(csvData.rows.length / BATCH_SIZE);
    setTotalBatches(batches);
    setProcessedBatches(0);

    // Animate progress bar while AI is working
    let fakeBatch = 0;
    const tick = setInterval(() => {
      fakeBatch = Math.min(fakeBatch + 1, batches - 1);
      setProcessedBatches(fakeBatch);
    }, 1800);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/import`, {
        method: "POST",
        body: formData,
      });

      clearInterval(tick);

      if (!res.ok) {
        const errBody = (await res.json()) as ApiResponse<never>;
        throw new Error(errBody.error ?? `Server error: ${res.status}`);
      }

      const body = (await res.json()) as ApiResponse<ImportResult>;
      if (!body.success || !body.data) {
        throw new Error(body.error ?? "Unexpected response from server");
      }

      setProcessedBatches(batches); // show 100%
      setResult(body.data);
      await new Promise((r) => setTimeout(r, 600)); // brief pause at 100%
      setStep(4);
    } catch (err) {
      clearInterval(tick);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep(2); // return to preview so user can retry
    }
  }, [file, csvData]);

  // Reset
  const handleReset = useCallback(() => {
    setStep(1); setFile(null); setCsvData(null);
    setResult(null); setError(null);
    setProcessedBatches(0); setTotalBatches(0);
  }, []);

  // Render
  return (
    <div style={{ minHeight: "100vh", padding: "32px 16px" }}>

      {/* ── Header ── */}
      <header style={{ textAlign: "center", marginBottom: "48px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "10px",
          marginBottom: "16px", padding: "6px 16px",
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "999px",
        }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 8px #10b981" }} />
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>
            Powered by Google Gemini AI
          </span>
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 48px)", fontWeight: "800",
          lineHeight: "1.15", marginBottom: "12px", letterSpacing: "-0.02em",
        }}>
          <span className="gradient-text">AI-Powered</span> CSV Importer
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "520px", margin: "0 auto" }}>
          Upload any CSV and let AI intelligently map your data to GrowEasy CRM fields —
          regardless of column names or source format.
        </p>
      </header>

      {/* ── Main card ── */}
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        <div className="card" style={{ padding: "32px" }}>
          <StepIndicator currentStep={step} />

          {/* Error banner */}
          {error && (
            <div style={{
              marginBottom: "20px", padding: "12px 16px",
              background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)",
              borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span>⚠️</span>
              <span style={{ fontSize: "14px", color: "#f43f5e" }}>{error}</span>
            </div>
          )}

          {/* Step 1 — Upload */}
          {step === 1 && (
            <div className="animate-fade-in">
              <UploadZone onFileSelect={handleFileSelect} />
            </div>
          )}

          {/* Step 2 — Preview */}
          {step === 2 && csvData && (
            <div className="animate-fade-in">
              <PreviewTable headers={csvData.headers} rows={csvData.rows} />
              <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
                <button className="btn-outline" onClick={handleReset} id="back-to-upload-btn">
                  ← Back
                </button>
                <button className="btn-primary" onClick={handleConfirmImport} id="confirm-import-btn">
                  🚀 Confirm &amp; Import with AI
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Loading */}
          {step === 3 && (
            <LoadingOverlay
              totalRows={csvData?.rows.length ?? 0}
              processedBatches={processedBatches}
              totalBatches={totalBatches}
            />
          )}

          {/* Step 4 — Results */}
          {step === 4 && result && (
            <ResultTable result={result} onReset={handleReset} />
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "20px" }}>
          GrowEasy CSV Importer · Supports Facebook Ads, Google Ads, Excel, and any CSV format
        </p>
      </div>
    </div>
  );
}
