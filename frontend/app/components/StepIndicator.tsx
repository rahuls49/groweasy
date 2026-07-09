"use client";

interface Step {
  number: number;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Upload",  description: "Select CSV file" },
  { number: 2, label: "Preview", description: "Review your data" },
  { number: 3, label: "Confirm", description: "Start AI import" },
  { number: 4, label: "Results", description: "View CRM records" },
];

interface StepIndicatorProps {
  currentStep: number; // 1-4
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: "40px" }}>
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.number;
        const isActive    = currentStep === step.number;

        return (
          <div key={step.number} style={{ display: "flex", alignItems: "center", flex: idx < STEPS.length - 1 ? "1" : "0" }}>
            {/* Step node */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "80px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  background: isCompleted
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : isActive
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "rgba(255,255,255,0.06)",
                  color: isCompleted || isActive ? "#fff" : "#475569",
                  boxShadow: isActive ? "0 0 20px rgba(99,102,241,0.5)" : "none",
                  border: isActive ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <div style={{ marginTop: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: isActive ? "var(--text-primary)" : isCompleted ? "#10b981" : "var(--text-muted)" }}>
                  {step.label}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "2px",
                  marginBottom: "24px",
                  background: isCompleted
                    ? "linear-gradient(90deg, #10b981, #6366f1)"
                    : "rgba(255,255,255,0.06)",
                  transition: "background 0.4s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
