/**
 * Server-side limits for album creation. Server actions are callable directly,
 * so these guard against oversized or malformed input regardless of the client
 * form. Pure and unit-testable.
 */

import type { ParsedCatalogItem } from './csv-catalog';

export const COLLECTION_LIMITS = {
  maxCsvChars: 200_000,
  maxItems: 5_000,
  maxNameLen: 120,
  maxPublisherLen: 120,
  maxCodeLen: 64,
  maxItemNameLen: 200,
  maxSectionLen: 120,
  maxRarityLen: 40,
  minYear: 1900,
  maxYear: 2200,
} as const;

export interface CollectionInputMeta {
  name: string;
  publisher?: string;
  year?: number;
  csv: string;
}

/** Validate album metadata and parsed items against the limits; returns errors. */
export function validateCollectionInput(
  input: CollectionInputMeta,
  items: ParsedCatalogItem[],
): string[] {
  const L = COLLECTION_LIMITS;
  const errors: string[] = [];

  const name = input.name.trim();
  if (name === '') errors.push('Album name is required.');
  else if (name.length > L.maxNameLen) {
    errors.push(`Album name must be at most ${L.maxNameLen} characters.`);
  }

  if (input.publisher && input.publisher.length > L.maxPublisherLen) {
    errors.push(`Publisher must be at most ${L.maxPublisherLen} characters.`);
  }

  if (input.csv.length > L.maxCsvChars) {
    errors.push(`Checklist is too large (max ${L.maxCsvChars} characters).`);
  }

  if (
    input.year !== undefined &&
    (!Number.isInteger(input.year) || input.year < L.minYear || input.year > L.maxYear)
  ) {
    errors.push(`Year must be a whole number between ${L.minYear} and ${L.maxYear}.`);
  }

  if (items.length > L.maxItems) {
    errors.push(`Too many items (max ${L.maxItems}).`);
  }

  const hasOverlongField = items.some(
    (i) =>
      i.code.length > L.maxCodeLen ||
      i.name.length > L.maxItemNameLen ||
      (i.section?.length ?? 0) > L.maxSectionLen ||
      i.rarity.length > L.maxRarityLen,
  );
  if (hasOverlongField) {
    errors.push('One or more items have fields that are too long.');
  }

  return errors;
}
