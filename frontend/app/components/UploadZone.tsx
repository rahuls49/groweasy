"use client";

import { useCallback, useState, useRef } from "react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export default function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        alert("Please upload a valid CSV file.");
        return;
      }
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`upload-zone ${isDragOver ? "drag-over" : ""}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !isLoading && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload CSV file"
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        id="csv-file-input"
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={onInputChange}
      />

      {/* Icon */}
      <div className="animate-float" style={{ marginBottom: "20px" }}>
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
          border: "1px solid rgba(99,102,241,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#uploadGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="uploadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
      </div>

      {selectedFile ? (
        <div>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "6px" }}>
            ✅ {selectedFile.name}
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {(selectedFile.size / 1024).toFixed(1)} KB · Click to replace
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
            {isDragOver ? "Drop your CSV here!" : "Drag & drop your CSV file"}
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
            or click to browse · Max 10 MB
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
            {["Facebook Ads", "Google Ads", "Excel Export", "Real Estate CRM", "Sales Report"].map((src) => (
              <span key={src} className="badge badge-neutral">{src}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
