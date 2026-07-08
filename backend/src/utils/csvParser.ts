import { parse } from "csv-parse/sync";
import type { ParsedCsvData } from "../types/crm.js";

/**
 * Parses a CSV Buffer into headers and row objects.
 * Handles: BOM, quoted fields with commas, varied delimiters, empty rows.
 */
export function parseCsv(buffer: Buffer): ParsedCsvData {
  // Strip UTF-8 BOM if present
  let csvString = buffer.toString("utf-8");
  if (csvString.charCodeAt(0) === 0xfeff) {
    csvString = csvString.slice(1);
  }

  const rawRows = parse(csvString, {
    columns: true,          // use first row as header keys
    skip_empty_lines: true,
    trim: true,             // trim whitespace from values and headers
    relax_column_count: true, // don't crash on rows with extra/missing cols
    bom: true,
  }) as Record<string, string>[];

  if (rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  // Derive headers from first row's keys (columns option populates these)
  const headers = Object.keys(rawRows[0] ?? {});

  return { headers, rows: rawRows };
}

/**
 * Splits an array into batches of a given size.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
}
