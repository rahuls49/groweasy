"use client";

interface LoadingOverlayProps {
  totalRows: number;
  processedBatches: number;
  totalBatches: number;
}

export default function LoadingOverlay({ totalRows, processedBatches, totalBatches }: LoadingOverlayProps) {
  const progress = totalBatches > 0 ? Math.round((processedBatches / totalBatches) * 100) : 0;

  const messages = [
    "Analysing column headers…",
    "Mapping fields with AI…",
    "Extracting contact information…",
    "Validating CRM records…",
    "Finalising import…",
  ];

  const messageIndex = Math.min(
    Math.floor((processedBatches / Math.max(totalBatches, 1)) * messages.length),
    messages.length - 1
  );

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "64px 32px",
      textAlign: "center",
    }}>
      {/* Spinner */}
      <div style={{ position: "relative", width: "80px", height: "80px", marginBottom: "28px" }}>
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "3px solid rgba(99,102,241,0.15)",
        }} />
        <div
          className="animate-spin-slow"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: "#6366f1",
            borderRightColor: "#8b5cf6",
          }}
        />
        {/* Inner glow */}
        <div style={{
          position: "absolute",
          inset: "12px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.2), transparent)",
          animation: "pulse-ring 2s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}>
          🤖
        </div>
      </div>

      <h3 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>
        AI is processing your data
      </h3>

      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
        {messages[messageIndex]}
      </p>

      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "28px" }}>
        {totalRows} rows · Batch {processedBatches} of {totalBatches || "…"}
      </p>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: "320px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Progress</span>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--accent-primary)" }}>{progress}%</span>
        </div>
        <div style={{
          height: "6px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "999px",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: "999px",
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>
    </div>
  );
}
