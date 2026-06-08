'use server';

/**
 * Server action to create a user-owned album from a CSV checklist. Any signed-in
 * user may create albums; verification (isOfficial) is a separate admin action.
 */

import { db } from '@/db/index';
import { getCurrentUserId } from '@/lib/auth';
import { createCollection } from '@/db/collections-repo';
import { parseCatalogCsv } from '@/lib/csv-catalog';
import { validateCollectionInput, COLLECTION_LIMITS } from '@/lib/collection-input';

export interface CreateCollectionInput {
  name: string;
  publisher?: string;
  year?: number;
  csv: string;
}

export interface CreateCollectionResult {
  ok: boolean;
  slug?: string;
  errors?: string[];
}

export async function createCollectionFromCsv(
  input: CreateCollectionInput,
): Promise<CreateCollectionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, errors: ['You must be signed in to create an album.'] };

  // Cap input size before parsing so a huge payload can't force a big parse.
  if (typeof input.csv !== 'string' || input.csv.length > COLLECTION_LIMITS.maxCsvChars) {
    return {
      ok: false,
      errors: [`Checklist is too large (max ${COLLECTION_LIMITS.maxCsvChars} characters).`],
    };
  }

  const { items, errors } = parseCatalogCsv(input.csv);
  if (errors.length > 0) return { ok: false, errors };

  const validationErrors = validateCollectionInput(input, items);
  if (validationErrors.length > 0) return { ok: false, errors: validationErrors };

  const slug = await createCollection(db, {
    ownerId: userId,
    name: input.name.trim(),
    publisher: input.publisher?.trim() || undefined,
    year: input.year,
    items,
  });
  return { ok: true, slug };
}
