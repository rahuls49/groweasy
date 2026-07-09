"use client";

import type { ImportResult, CrmRecord, SkippedRecord } from "../types/crm";

interface ResultTableProps {
  result: ImportResult;
  onReset: () => void;
}

const CRM_STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  GOOD_LEAD_FOLLOW_UP: { label: "Follow Up",      badge: "badge-success" },
  DID_NOT_CONNECT:     { label: "Did Not Connect", badge: "badge-warn"    },
  BAD_LEAD:            { label: "Bad Lead",        badge: "badge-error"   },
  SALE_DONE:           { label: "Sale Done",       badge: "badge-success" },
  "":                  { label: "—",               badge: "badge-neutral" },
};

const CRM_FIELDS: { key: keyof CrmRecord; label: string }[] = [
  { key: "name",                        label: "Name"         },
  { key: "email",                       label: "Email"        },
  { key: "country_code",                label: "CC"           },
  { key: "mobile_without_country_code", label: "Mobile"       },
  { key: "company",                     label: "Company"      },
  { key: "city",                        label: "City"         },
  { key: "state",                       label: "State"        },
  { key: "country",                     label: "Country"      },
  { key: "crm_status",                  label: "Status"       },
  { key: "data_source",                 label: "Source"       },
  { key: "lead_owner",                  label: "Lead Owner"   },
  { key: "crm_note",                    label: "Notes"        },
  { key: "created_at",                  label: "Created At"   },
  { key: "description",                 label: "Description"  },
  { key: "possession_time",             label: "Possession"   },
];

export default function ResultTable({ result, onReset }: ResultTableProps) {
  const { records, skippedRecords, importedCount, skippedCount, totalRows, filename } = result;

  const successRate = totalRows > 0 ? Math.round((importedCount / totalRows) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>
            Import Complete
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{filename}</p>
        </div>
        <button className="btn-outline" onClick={onReset} id="import-again-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
          </svg>
          Import Another
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Total Rows",  value: totalRows,      color: "var(--text-primary)" },
          { label: "Imported",    value: importedCount,  color: "#10b981"             },
          { label: "Skipped",     value: skippedCount,   color: skippedCount > 0 ? "#f43f5e" : "var(--text-muted)" },
          { label: "Success Rate", value: `${successRate}%`, color: successRate >= 80 ? "#10b981" : "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div style={{ fontSize: "24px", fontWeight: "800", color, marginBottom: "4px" }}>{value}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Imported Records ── */}
      {records.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
              CRM Records
            </h3>
            <span className="badge badge-success">{importedCount} imported</span>
          </div>
          <div className="table-container">
            <table className="data-table" id="crm-result-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>#</th>
                  {CRM_FIELDS.map((f) => <th key={f.key}>{f.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>{i + 1}</td>
                    {CRM_FIELDS.map(({ key }) => (
                      <td key={key} title={rec[key]}>
                        {key === "crm_status" ? (
                           <span className={`badge ${CRM_STATUS_LABELS[rec.crm_status]?.badge ?? "badge-neutral"}`}>
                             {(CRM_STATUS_LABELS[rec.crm_status]?.label ?? rec.crm_status) || "—"}
                           </span>
                        ) : rec[key] ? (
                          rec[key]
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Skipped Records ── */}
      {skippedRecords.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
              Skipped Records
            </h3>
            <span className="badge badge-error">{skippedCount} skipped</span>
          </div>
          <div className="table-container" style={{ maxHeight: "250px" }}>
            <table className="data-table" id="skipped-records-table">
              <thead>
                <tr>
                  <th>Row #</th>
                  <th>Reason</th>
                  <th>Raw Data (preview)</th>
                </tr>
              </thead>
              <tbody>
                {skippedRecords.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--text-muted)" }}>{s.rowIndex + 1}</td>
                    <td><span className="badge badge-error">{s.reason}</span></td>
                    <td style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {Object.entries(s.rawData).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
