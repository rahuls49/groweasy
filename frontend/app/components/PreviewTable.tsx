"use client";

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

export default function PreviewTable({ headers, rows }: PreviewTableProps) {
  const displayRows = rows.slice(0, 100); // cap preview at 100 rows for perf

  return (
    <div>
      {/* Summary bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "12px",
        flexWrap: "wrap",
        gap: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
            CSV Preview
          </span>
          <span className="badge badge-neutral">{rows.length} rows</span>
          <span className="badge badge-neutral">{headers.length} columns</span>
        </div>
        {rows.length > 100 && (
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Showing first 100 rows
          </span>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table" id="preview-table">
          <thead>
            <tr>
              <th style={{ width: "48px", color: "var(--text-muted)" }}>#</th>
              {headers.map((h) => (
                <th key={h}>{h || "(empty)"}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i}>
                <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>{i + 1}</td>
                {headers.map((h) => (
                  <td key={h} title={row[h] ?? ""}>
                    {row[h] || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
