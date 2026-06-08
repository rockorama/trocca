/**
 * Parse a pasted/uploaded CSV checklist into catalog items, so anyone can turn
 * an album list into a Trocca collection template.
 *
 * Format (header optional, case-insensitive): `code,name,section,rarity`.
 *  - `code`   (required) stable id within the album, e.g. "BRA-01"
 *  - `name`   (required) human label, e.g. "Brazil — Player 1"
 *  - `section`(optional) grouping key, e.g. "Brazil"
 *  - `rarity` (optional) defaults to "base"
 *
 * Pure and side-effect-free: returns parsed rows plus human-readable errors with
 * line numbers, so the importer can preview and block invalid input.
 */

export interface ParsedCatalogItem {
  code: string;
  name: string;
  section?: string;
  rarity: string;
  sortOrder: number;
}

export interface ParsedCatalog {
  items: ParsedCatalogItem[];
  errors: string[];
}

/** Split one CSV line into fields, honoring double-quoted values with commas. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"'; // escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields.map((f) => f.trim());
}

const HEADER_RE = /^code\b/i;

export function parseCatalogCsv(text: string): ParsedCatalog {
  const items: ParsedCatalogItem[] = [];
  const errors: string[] = [];
  const seenCodes = new Set<string>();

  const rawLines = text.split(/\r?\n/);
  let order = 0;

  rawLines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const line = raw.trim();
    if (line === '') return; // skip blank lines
    if (idx === 0 && HEADER_RE.test(line)) return; // skip a header row

    const [code = '', name = '', section = '', rarity = ''] = splitCsvLine(line);

    if (code === '' || name === '') {
      errors.push(`Line ${lineNo}: both "code" and "name" are required`);
      return;
    }
    if (seenCodes.has(code)) {
      errors.push(`Line ${lineNo}: duplicate code "${code}"`);
      return;
    }
    seenCodes.add(code);

    items.push({
      code,
      name,
      section: section === '' ? undefined : section,
      rarity: rarity === '' ? 'base' : rarity,
      sortOrder: order++,
    });
  });

  if (items.length === 0 && errors.length === 0) {
    errors.push('No items found — add at least one "code,name" row.');
  }

  return { items, errors };
}
