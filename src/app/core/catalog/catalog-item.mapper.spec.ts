import {
  mapCatalogItem,
  normalizeCatalogIncludes,
} from './catalog-item.mapper';

describe('catalog item includes mapping', () => {
  it('prefers commercialData.includes when the legacy root field is stale', () => {
    const item = mapCatalogItem('product-1', {
      code: 'SKU-1',
      commercialData: { includes: ['Tarjeta actualizada'] },
      includes: ['Tarjeta antigua', 'Valor residual'],
    });

    expect(item.includes).toEqual(['Tarjeta actualizada']);
    expect(item.commercialData?.includes).toEqual(['Tarjeta actualizada']);
  });

  it('uses the root includes field for legacy documents without the nested field', () => {
    const item = mapCatalogItem('product-legacy', {
      code: 'SKU-LEGACY',
      commercialData: {},
      includes: [' Tarjeta ', '', 'Moño', 'Peluche', 'Elemento adicional'],
    });

    expect(item.includes).toEqual(['Tarjeta', 'Moño', 'Peluche']);
    expect(item.commercialData?.includes).toEqual(item.includes);
  });

  it('keeps a canonical empty array instead of restoring stale root values', () => {
    const item = mapCatalogItem('product-cleared', {
      commercialData: { includes: [] },
      includes: ['Valor anterior'],
    });

    expect(item.includes).toEqual([]);
    expect(item.commercialData?.includes).toEqual([]);
  });

  it('normalizes empty, whitespace-only, and duplicate values within the limit', () => {
    expect(
      normalizeCatalogIncludes([
        '  Tarjeta  ',
        '',
        '   ',
        'tarjeta',
        'Moño',
        'Peluche',
        'Jarrón',
      ]),
    ).toEqual(['Tarjeta', 'Moño', 'Peluche']);
  });
});
