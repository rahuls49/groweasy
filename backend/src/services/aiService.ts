import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import {
  ALLOWED_CRM_STATUSES,
  ALLOWED_DATA_SOURCES,
  type AiBatchResult,
  type CrmRecord,
  type SkippedRecord,
} from "../types/crm.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.1, // low temp for deterministic field mapping
  },
});

// System prompt

function buildPrompt(
  headers: string[],
  rows: Record<string, string>[],
  batchStartIndex: number
): string {
  return `
You are a CRM data extraction assistant for GrowEasy, a real-estate CRM platform.
You will receive rows from a CSV file. The CSV may come from any source (Facebook Ads, Google Ads, Excel sheets, real estate portals, sales reports, etc.) and will have DIFFERENT column names each time.

Your job is to intelligently MAP each row's columns to the GrowEasy CRM format, regardless of what the column names are.

## CRM Fields to Extract
| Field | Description |
|---|---|
| created_at | Lead creation date (any parsable date format) |
| name | Full name of the lead |
| email | Primary email address |
| country_code | Country dialing code e.g. +91, +1 |
| mobile_without_country_code | Phone number WITHOUT country code |
| company | Company or organization name |
| city | City |
| state | State or province |
| country | Country name |
| lead_owner | Email or name of the sales person who owns the lead |
| crm_status | Lead status (see allowed values below) |
| crm_note | Notes, remarks, follow-up info, extra emails/phones |
| data_source | Traffic/ad source (see allowed values below) |
| possession_time | Property possession timeline if mentioned |
| description | Any extra description or context |

## Strict Rules

### crm_status — ONLY use one of these exact values:
${ALLOWED_CRM_STATUSES.map((s) => `- ${s}`).join("\n")}
If none clearly match, leave as empty string "".

### data_source — ONLY use one of these exact values:
${ALLOWED_DATA_SOURCES.map((s) => `- ${s}`).join("\n")}
Map intelligently: e.g. "leads on demand", "LOD" → "leads_on_demand"; "Meridian" → "meridian_tower"; "Eden" → "eden_park". If nothing matches confidently, leave as "".

### created_at
Must be a date string parseable by JavaScript's \`new Date()\`. Keep original if already valid. If ambiguous, convert to ISO 8601 format (e.g., "2026-05-13 14:20:48").

### email
Use only the FIRST email address found. If additional emails exist, append them to crm_note prefixed with "Extra emails: ".

### mobile_without_country_code
- Strip any country code prefix (e.g. "+91", "0091", "91" at start) from the phone number.
- Use only the FIRST phone number. Append extra numbers to crm_note prefixed with "Extra phones: ".

### crm_note
Aggregate: remarks, follow-up notes, extra contact info, anything that doesn't fit other fields. Combine using "; " separator. Avoid raw line breaks — use \n as literal escape if needed so the CSV row stays valid.

### Skip rule
If a row has NEITHER a valid email NOR a valid mobile number, SKIP it entirely and include it in the "skipped" array with a reason.

### Handling unknown/extra columns
If a column doesn't map to any CRM field but contains useful info, put it in the \`description\` field.

## Input
CSV Headers: ${JSON.stringify(headers)}

Rows (0-indexed from row ${batchStartIndex}):
${JSON.stringify(rows, null, 2)}

## Output Format
Return ONLY a valid JSON object with this exact shape. No markdown, no explanation:
{
  "records": [
    {
      "rowIndex": <original row index>,
      "created_at": "",
      "name": "",
      "email": "",
      "country_code": "",
      "mobile_without_country_code": "",
      "company": "",
      "city": "",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "",
      "crm_note": "",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ],
  "skipped": [
    {
      "rowIndex": <original row index>,
      "reason": "<why this row was skipped>"
    }
  ]
}

Rules for the output:
- Every successfully processed row must appear in "records"
- Every skipped row must appear in "skipped" with a clear reason
- Use empty string "" for fields that cannot be determined — NEVER use null or undefined
- Do NOT include rowIndex in the final CrmRecord fields; it is only used to match back to input
`.trim();
}

// ─── AI call with retry ───────────────────────────────────────────────────────

async function callGeminiWithRetry(
  prompt: string,
  attempt = 1
): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    if (attempt >= env.AI_MAX_RETRIES) {
      throw new Error(
        `Gemini API failed after ${env.AI_MAX_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    const delay = Math.pow(2, attempt) * 500; // exponential backoff: 1s, 2s, 4s
    console.warn(`⚠️  Gemini attempt ${attempt} failed. Retrying in ${delay}ms…`);
    await new Promise((r) => setTimeout(r, delay));
    return callGeminiWithRetry(prompt, attempt + 1);
  }
}

// ─── Parse AI response ────────────────────────────────────────────────────────

interface RawAiOutput {
  records: Array<{ rowIndex: number } & Record<string, string>>;
  skipped: Array<{ rowIndex: number; reason: string }>;
}

function parseAiResponse(
  text: string,
  rows: Record<string, string>[],
  batchStartIndex: number
): AiBatchResult {
  let parsed: RawAiOutput;

  try {
    // Strip any accidental markdown fences
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(clean) as RawAiOutput;
  } catch {
    throw new Error(`Failed to parse Gemini JSON response: ${text.slice(0, 200)}`);
  }

  const records: CrmRecord[] = (parsed.records ?? []).map((r) => {
    const { rowIndex: _ri, ...fields } = r;

    // Sanitise: ensure crm_status and data_source are within allowed values
    const crm_status = ALLOWED_CRM_STATUSES.includes(fields["crm_status"] as never)
      ? (fields["crm_status"] as CrmRecord["crm_status"])
      : "";

    const data_source = ALLOWED_DATA_SOURCES.includes(fields["data_source"] as never)
      ? (fields["data_source"] as CrmRecord["data_source"])
      : "";

    return {
      created_at: fields["created_at"] ?? "",
      name: fields["name"] ?? "",
      email: fields["email"] ?? "",
      country_code: fields["country_code"] ?? "",
      mobile_without_country_code: fields["mobile_without_country_code"] ?? "",
      company: fields["company"] ?? "",
      city: fields["city"] ?? "",
      state: fields["state"] ?? "",
      country: fields["country"] ?? "",
      lead_owner: fields["lead_owner"] ?? "",
      crm_status,
      crm_note: fields["crm_note"] ?? "",
      data_source,
      possession_time: fields["possession_time"] ?? "",
      description: fields["description"] ?? "",
    } satisfies CrmRecord;
  });

  const skippedRecords: SkippedRecord[] = (parsed.skipped ?? []).map((s) => ({
    rowIndex: batchStartIndex + s.rowIndex,
    rawData: rows[s.rowIndex] ?? {},
    reason: s.reason,
  }));

  return { records, skippedRecords };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Processes one batch of CSV rows through Gemini AI and returns extracted CRM records.
 */
export async function extractCrmRecords(
  headers: string[],
  rows: Record<string, string>[],
  batchStartIndex: number
): Promise<AiBatchResult> {
  const prompt = buildPrompt(headers, rows, batchStartIndex);
  const responseText = await callGeminiWithRetry(prompt);
  return parseAiResponse(responseText, rows, batchStartIndex);
}
