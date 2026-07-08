import { env } from "../config/env.js";
import { extractCrmRecords } from "./aiService.js";
import { parseCsv, chunk } from "../utils/csvParser.js";
import type { ImportResult, CrmRecord, SkippedRecord } from "../types/crm.js";

/**
 * Full pipeline: CSV buffer → parse → AI batches → ImportResult.
 * Stateless — no database, each call is self-contained.
 */
export async function processImport(
  fileBuffer: Buffer,
  filename: string
): Promise<ImportResult> {
  // 1. Parse CSV
  const { headers, rows } = parseCsv(fileBuffer);

  if (rows.length === 0) {
    return {
      filename,
      totalRows: 0,
      importedCount: 0,
      skippedCount: 0,
      records: [],
      skippedRecords: [],
    };
  }

  // 2. Split into batches
  const batches = chunk(rows, env.AI_BATCH_SIZE);

  console.log(
    `📂 Processing "${filename}": ${rows.length} rows in ${batches.length} batch(es) of ${env.AI_BATCH_SIZE}`
  );

  // 3. Process each batch sequentially (avoids rate-limit spikes) 
  const allRecords: CrmRecord[] = [];
  const allSkipped: SkippedRecord[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!;
    const batchStartIndex = i * env.AI_BATCH_SIZE;

    console.log(
      `  🤖 Batch ${i + 1}/${batches.length} — rows ${batchStartIndex}–${batchStartIndex + batch.length - 1}`
    );

    try {
      const { records, skippedRecords } = await extractCrmRecords(
        headers,
        batch,
        batchStartIndex
      );
      allRecords.push(...records);
      allSkipped.push(...skippedRecords);
    } catch (err) {
      // If a batch permanently fails after retries, mark ALL rows in batch as skipped
      console.error(`  ❌ Batch ${i + 1} failed:`, err instanceof Error ? err.message : err);
      for (let j = 0; j < batch.length; j++) {
        allSkipped.push({
          rowIndex: batchStartIndex + j,
          rawData: batch[j]!,
          reason: `AI processing failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      }
    }
  }

  console.log(
    `✅ Done: ${allRecords.length} imported, ${allSkipped.length} skipped`
  );

  return {
    filename,
    totalRows: rows.length,
    importedCount: allRecords.length,
    skippedCount: allSkipped.length,
    records: allRecords,
    skippedRecords: allSkipped,
  };
}
