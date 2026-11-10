import type { CatalogItem } from '../models/catalog-item.model';

export function normalizeCatalogIncludes(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const includes: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== 'string') {
      continue;
    }

    const include = entry.trim();
    const key = include.toLocaleLowerCase();

    if (!include || seen.has(key)) {
      continue;
    }

    seen.add(key);
    includes.push(include);

    if (includes.length === 3) {
      break;
    }
  }

  return includes;
}

export function mapCatalogItem(
  id: string,
  data: Record<string, unknown>,
): CatalogItem {
  const rawCommercialData = data['commercialData'];
  const commercialData =
    typeof rawCommercialData === 'object' &&
    rawCommercialData !== null &&
    !Array.isArray(rawCommercialData)
      ? rawCommercialData as Record<string, unknown>
      : undefined;
  const nestedIncludes = commercialData?.['includes'];
  const rootIncludes = data['includes'];
  const includes = normalizeCatalogIncludes(
    Array.isArray(nestedIncludes) ? nestedIncludes : rootIncludes,
  );

  return {
    ...data,
    id,
    includes,
    commercialData: commercialData
      ? { ...commercialData, includes } as CatalogItem['commercialData']
      : undefined,
  } as CatalogItem;
}
