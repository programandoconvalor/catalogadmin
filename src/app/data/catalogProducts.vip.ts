import { siteData } from "./siteData";
/* ============================================================
 * TYPES
 * ============================================================ */
export type BadgeType =
  | "new"
  | "customized"
  | "specialDay"
  | "bestSeller"
  | null;
export type ProductVariantId = "aire" | "helio";
export type CatalogCategory = {
  id: string;
  label: string;
  productCategoryIds: string[];
  ui: {
    arrowsOnHover: boolean;
  };
};
export type CatalogMenuGroup = {
  id: string;
  label: string;
  items: string[];
};
export type CatalogBranding = {
  businessType: string;
  businessName: string;
  sectionLabel: string;
  logoSrc: string;
};
export type ProductSizeOption = {
  id: ProductVariantId;
  priceMxn: number;
  buttonLabel: string;
  titleLabel: string;
  images: string[];
};
export type ProductSize = {
  id: string;
  label: string;
  priceMxn: number;
  subtitle: string;
};
export type ProductMenuAssignment = {
  groupId: string;
  subcategory: string;
};
export type CatalogProduct = {
  id: number;
  categoryId: string;
  titleTemplate?: string;
  baseTitle: string;
  subtitle?: string;
  description: string;
  includes: string[];
  deliveryZones: string[];
  isAvailable: boolean;
  badgeLabel?: string;
  defaultVariantId?: ProductVariantId;
  basePriceMxn: number;
  defaultImages: string[];
  activeSizeOptions: ProductSizeOption[];
  productSizes?: ProductSize[];
  colorDots: string[];
  badge: BadgeType | "";
  deliveryMessage?: string;
  sku: string;
  menuAssignments: ProductMenuAssignment[];
  ui: {
    showBadge: boolean;
    showDeliveryDate: boolean;
    showColorDots: boolean;
    showProductSizes?: boolean;
    showStandard?: boolean;
    showPremium?: boolean;
    showLuxury?: boolean;
  };
};
/* ============================================================
 * CATEGORIES VIP
 * ============================================================ */
export const catalogCategories: CatalogCategory[] = [
  {
    id: "all",
    label: "Todos",
    productCategoryIds: ["rosas", "gerberas", "corazones", "girasoles", "combinados"],
    ui: { arrowsOnHover: true },
  },
  { id: "rosas", label: "Rosas", productCategoryIds: ["rosas"], ui: { arrowsOnHover: true } },
  { id: "gerberas", label: "Gerberas", productCategoryIds: ["gerberas"], ui: { arrowsOnHover: true } },
  { id: "corazones", label: "Corazones", productCategoryIds: ["corazones"], ui: { arrowsOnHover: true } },
  { id: "girasoles", label: "Girasoles", productCategoryIds: ["girasoles"], ui: { arrowsOnHover: true } },
  { id: "combinados", label: "Combinados", productCategoryIds: ["combinados"], ui: { arrowsOnHover: true } },
];
/* ============================================================
 * MENU TREE GENERAL
 * ============================================================ */
export const catalogMenuTree: CatalogMenuGroup[] = [
  { id: "rosas", label: "Rosas", items: ["Todos"] },
  { id: "gerberas", label: "Gerberas", items: [] },
  { id: "corazones", label: "Corazones", items: [] },
  { id: "girasoles", label: "Girasoles", items: [] },
  { id: "combinados", label: "Combinados", items: [] },
];
/* ============================================================
 * BRANDING
 * ============================================================ */
export const catalogBranding: CatalogBranding = {
  businessType: siteData.brand.businessType,
  businessName: siteData.brand.businessName,
  sectionLabel: siteData.brand.sectionLabel,
  logoSrc: siteData.brand.logoSrc,
};
/* ============================================================
 * VIP PRODUCTS
 *
 * Se incluyen las 41 imágenes del catálogo.
 * Cada imagen se mantiene como producto independiente para que
 * ninguna fotografía quede fuera del catálogo.
 * Los nombres, precios y variantes son propuestas comerciales
 * iniciales y pueden ajustarse posteriormente.
 * ============================================================
 */
export const catalogProducts: CatalogProduct[] = [
  {
    id: 1001,
    categoryId: "rosas",
    baseTitle: "Royal Red",
    subtitle: "100 ROSAS ROJAS + GIPSOFILA PREMIUM",
    description: "Royal Red: arreglo floral premium elaborado con 100 rosas rojas + gipsofila premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1250,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_1.jpg",
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_2.jpg",
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_3.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 750,
        subtitle: "50 ROSAS ROJAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6500,
        subtitle: "100 ROSAS ROJAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8300,
        subtitle: "100 ROSAS ROJAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1001",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
  showBadge: true,
  showDeliveryDate: false,
  showColorDots: false,
  showProductSizes: false,
  showStandard: false,
  showPremium: false,
  showLuxury: false,
},
  },
  {
    id: 1003,
    categoryId: "corazones",
    baseTitle: "Scarlet Heart",
    subtitle: "100 ROSAS ROJAS + 30 FERRERO",
    description: "Scarlet Heart: arreglo floral premium elaborado con 100 rosas rojas + 30 ferrero. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1850,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_3.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5900,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 7200,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 9200,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1003",
    menuAssignments: [
      {
        groupId: "corazones",
        subcategory: "CORAZONES",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1004,
    categoryId: "gerberas",
    baseTitle: "Colorful Garden",
    subtitle: "50 GERBERAS PREMIUM",
    description: "Colorful Garden: arreglo floral premium elaborado con 50 gerberas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1450,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_4.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5100,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6200,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7900,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1004",
    menuAssignments: [
      {
        groupId: "gerberas",
        subcategory: "GERBERAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1005,
    categoryId: "combinados",
    baseTitle: "Happy Birthday",
    subtitle: "100 ROSAS PREMIUM + PELUCHE",
    description: "Happy Birthday: arreglo floral premium elaborado con 100 rosas premium + peluche. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1600,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_5.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4800,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 5800,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7400,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1005",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1031,
    categoryId: "corazones",
    baseTitle: "Queen’s Heart",
    subtitle: "200 ROSAS + CORONA",
    description: "Queen’s Heart: arreglo floral premium elaborado con 200 rosas + corona. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 2500,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_31.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 7000,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 8500,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 10900,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1031",
    menuAssignments: [
      {
        groupId: "corazones",
        subcategory: "CORAZONES",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1006,
    categoryId: "combinados",
    baseTitle: "Bouquet of Roses",
    subtitle: "100 ROSAS COLOR PREMIUM",
    description: "Bouquet of Roses: arreglo floral premium elaborado con 100 rosas color premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1250,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_6.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5600,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6800,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8700,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1006",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1007,
    categoryId: "girasoles",
    baseTitle: "Golden Sun",
    subtitle: "30 GIRASOLES + CORONA PREMIUM",
    description: "Golden Sun: arreglo floral premium elaborado con 30 girasoles + corona premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1450,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_7.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4300,
        subtitle: "20 GIRASOLES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 5200,
        subtitle: "30 GIRASOLES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 6700,
        subtitle: "40 GIRASOLES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1007",
    menuAssignments: [
      {
        groupId: "girasoles",
        subcategory: "GIRASOLES",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1008,
    categoryId: "gerberas",
    baseTitle: "Pink Royal",
    subtitle: "50 GERBERAS ROSAS PREMIUM",
    description: "Pink Royal: arreglo floral premium elaborado con 50 gerberas rosas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1900,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_8.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4800,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 5800,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7400,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1008",
    menuAssignments: [
      {
        groupId: "gerberas",
        subcategory: "GERBERAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1009,
    categoryId: "combinados",
    baseTitle: "Ruby Crown",
    subtitle: "100 ROSAS PREMIUM + 20 BILLETES (DE 100 MXN C/U)",
    description: "Ruby Crown: arreglo floral premium elaborado con 100 rosas premium + 20 billetes (de 100 mxn c/u). Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 3500,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_9.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5100,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6200,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7900,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1009",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1010,
    categoryId: "combinados",
    baseTitle: "Spring Bouquet",
    subtitle: "15 GIRASOLES + 30 ROSAS PREMIUM",
    description: "Spring Bouquet: arreglo floral premium elaborado con 15 girasoles + 30 rosas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1650,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_10.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4600,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 5600,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7200,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1010",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1011,
    categoryId: "rosas",
    baseTitle: "Blush Garden",
    subtitle: "250 ROSAS PREMIUM",
    description: "Blush Garden: arreglo floral premium elaborado con 250 rosas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 2750,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_11.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4800,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 5900,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7600,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1011",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1012,
    categoryId: "rosas",
    baseTitle: "Classic Heart Red",
    subtitle: "100 ROSAS PREMIUM",
    description: "Classic Heart Red: arreglo floral premium elaborado con 100 rosas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1250,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_12.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4900,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6000,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7700,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1012",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1014,
    categoryId: "corazones",
    baseTitle: "Heart Royale",
    subtitle: "150 ROSAS PREMIUM",
    description: "Heart Royale: arreglo floral premium elaborado con 150 rosas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1750,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_14.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5700,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 7000,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 9000,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1014",
    menuAssignments: [
      {
        groupId: "corazones",
        subcategory: "CORAZONES",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1016,
    categoryId: "combinados",
    baseTitle: "Color Royale",
    subtitle: "36 GERBERAS PREMIUM",
    description: "Color Royale: arreglo floral premium elaborado con 36 gerberas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1100,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_16.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5100,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6200,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7900,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1016",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1017,
    categoryId: "rosas",
    baseTitle: "Royal Proposal",
    subtitle: "200 ROSAS + CORONA",
    description: "Royal Proposal: arreglo floral premium elaborado con 200 rosas + corona. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 2500,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_45.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 7000,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 8500,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 10900,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1017",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1018,
    categoryId: "combinados",
    baseTitle: "Grand Garden",
    subtitle: "25 GERBERAS + LIRIOS",
    description: "Grand Garden: arreglo floral premium elaborado con 25 gerberas + lirios. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1300,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_18.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5900,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 7200,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 9200,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1018",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1020,
    categoryId: "combinados",
    baseTitle: "Sunset Garden",
    subtitle: "20 GERBERAS + GIRASOLES + PELUCHE",
    description: "Sunset Garden: arreglo floral premium elaborado con 20 gerberas + girasoles + peluche. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1400,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_20.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5300,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6500,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8300,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1020",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1021,
    categoryId: "combinados",
    baseTitle: "Pink Celebration",
    subtitle: "ROSAS + LIRIOS + GERBERAS ",
    description: "Pink Celebration: arreglo floral premium elaborado con rosas + lirios + gerberas. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1200,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_21.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4800,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 5800,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7400,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1021",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1022,
    categoryId: "gerberas",
    baseTitle: "Royal Mix",
    subtitle: "40 GERBERAS PREMIUM",
    description: "Royal Mix: arreglo floral premium elaborado con 40 gerberas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1300,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_22.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5300,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6500,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8300,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1022",
    menuAssignments: [
      {
        groupId: "gerberas",
        subcategory: "GERBERAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1023,
    categoryId: "rosas",
    baseTitle: "Red Elegance",
    subtitle: "250 ROSAS ROJAS PREMIUM",
    description: "Red Elegance: arreglo floral premium elaborado con 250 rosas rojas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 2800,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_23.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5100,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6200,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7900,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1023",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1024,
    categoryId: "rosas",
    baseTitle: "Ruby Deluxe",
    subtitle: "100 ROSAS + GYPSOPHILA PREMIUM",
    description: "Ruby Deluxe: arreglo floral premium elaborado con 100 rosas + gypsophila premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1400,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_24.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5900,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 7200,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 9200,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1024",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1025,
    categoryId: "combinados",
    baseTitle: "Blue & Gold",
    subtitle: "GERBERAS + LIRIOS + ROSAS BLUE",
    description: "Blue & Gold: arreglo floral premium elaborado con gerberas + lirios + rosas blue. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1600,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_25.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5300,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6500,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8300,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1025",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1026,
    categoryId: "combinados",
    baseTitle: "Sunset Mix",
    subtitle: "30 ROSAS + 30 GIRASOLES PREMIUM",
    description: "Sunset Mix: arreglo floral premium elaborado con 30 rosas + 30 girasoles premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1800,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_26.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5100,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6200,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7900,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1026",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1027,
    categoryId: "rosas",
    baseTitle: "Scarlet Luxe",
    subtitle: "50 ROSAS PREMIUM",
    description: "Scarlet Luxe: arreglo floral premium elaborado con 50 rosas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 700,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_27.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5900,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 7200,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 9200,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1027",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1048,
    categoryId: "corazones",
    baseTitle: "Heart Red Gerberas",
    subtitle: "25 GERBERAS ROJAS",
    description: "Heart Red Gerberas: arreglo floral premium elaborado con 25 gerberas rojas. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1150,  
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_48.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5700,
        subtitle: "60 GERBERAS ROJAS",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 7000,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 9000,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1048",
    menuAssignments: [
      {
        groupId: "corazones",
        subcategory: "CORAZONES",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1028,
    categoryId: "rosas",
    baseTitle: "Golden Ruby",
    subtitle: "150 ROSAS + GIPSOFILA +  CORONA  PREMIUM",
    description: "Golden Ruby: arreglo floral premium elaborado con 150 rosas + gipsofila +  corona  premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 2000,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_28.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 6200,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 7600,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 9700,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1028",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1049,
    categoryId: "combinados",
    baseTitle: "White Garden",
    subtitle: "25 GERBERAS BLANCAS + GIPSOFILA + 25 ROSAS PREMIUM",
    description: "White Garden: arreglo floral premium elaborado con 25 gerberas blancas + gipsofila + 25 rosas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1300,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_49.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 6200,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 7600,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 9700,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1049",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1029,
    categoryId: "rosas",
    baseTitle: "Royal Teddy",
    subtitle: "100 ROSAS + FERRERO + PELUCHE + GIPSOFILA",
    description: "Royal Teddy: arreglo floral premium elaborado con 100 rosas + ferrero + peluche + gipsofila. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1900,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_29.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5700,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6900,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8800,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1029",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1050,
    categoryId: "rosas",
    baseTitle: "Roses",
    subtitle: "150 ROSAS + GIPSOFILA ROSA PREMIUM",
    description: "Roses: arreglo floral premium elaborado con 150 rosas + gipsofila rosa premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1900,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_50.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5700,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6900,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8800,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1050",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1030,
    categoryId: "gerberas",
    baseTitle: "Pink Gerbera",
    subtitle: "30 GERBERAS ROSAS + PERRITOS PREMIUM",
    description: "Pink Gerbera: arreglo floral premium elaborado con 30 gerberas rosas + perritos premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1100,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_30.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4300,
        subtitle: "40 GERBERAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 5200,
        subtitle: "60 GERBERAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 6700,
        subtitle: "80 GERBERAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1030",
    menuAssignments: [
      {
        groupId: "gerberas",
        subcategory: "GERBERAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1032,
    categoryId: "rosas",
    baseTitle: "White Elegance",
    subtitle: "100 ROSAS BLANCAS PREMIUM",
    description: "White Elegance: arreglo floral premium elaborado con 100 rosas blancas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1400,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_32.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4600,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 5600,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7200,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1032",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1033,
    categoryId: "girasoles",
    baseTitle: "Golden Bouquet",
    subtitle: "20 GIRASOLES MINI PREMIUM",
    description: "Golden Bouquet: arreglo floral premium elaborado con 20 girasoles mini premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1000,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_33.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5300,
        subtitle: "20 GIRASOLES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6500,
        subtitle: "30 GIRASOLES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8300,
        subtitle: "40 GIRASOLES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1033",
    menuAssignments: [
      {
        groupId: "girasoles",
        subcategory: "GIRASOLES",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1034,
    categoryId: "combinados",
    baseTitle: "Pink Royale",
    subtitle: "100 ROSAS + LIRIOS ROSAS",
    description: "Pink Royale: arreglo floral premium elaborado con 100 rosas + lirios rosas. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1700,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_34.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4800,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 5900,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7600,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1034",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1035,
    categoryId: "rosas",
    baseTitle: "Red Romance",
    subtitle: "75 ROSAS ROJAS PREMIUM",
    description: "Red Romance: arreglo floral premium elaborado con 75 rosas rojas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1000,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_35.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5100,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6200,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7900,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1035",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1036,
    categoryId: "girasoles",
    baseTitle: "Golden Teddy",
    subtitle: "7 GIRASOLES + STATE + PERLAS",
    description: "Golden Teddy: arreglo floral premium elaborado con 7 girasoles + state + perlas. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 800,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_36.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 6200,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 7600,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 9700,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1036",
    menuAssignments: [
      {
        groupId: "girasoles",
        subcategory: "GIRASOLES",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1037,
    categoryId: "girasoles",
    baseTitle: "Sunflower Crown",
    subtitle: "30 GIRASOLES PREMIUM",
    description: "Sunflower Crown: arreglo floral premium elaborado con 30 girasoles premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 2100,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_37.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5600,
        subtitle: "20 GIRASOLES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6800,
        subtitle: "30 GIRASOLES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8700,
        subtitle: "40 GIRASOLES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1037",
    menuAssignments: [
      {
        groupId: "girasoles",
        subcategory: "GIRASOLES",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1038,
    categoryId: "rosas",
    baseTitle: "Pink Garden",
    subtitle: "75 ROSAS PREMIUM",
    description: "Pink Garden: arreglo floral premium elaborado con 75 rosas premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1100,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_38.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 4900,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6000,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 7700,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1038",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1039,
    categoryId: "combinados",
    baseTitle: "Sweet Celebration",
    subtitle: "150 ROSAS + GIPSOFILA ROSA PREMIUM",
    description: "Sweet Celebration: arreglo floral premium elaborado con 150 rosas + gipsofila rosa premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 2000,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_39.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5300,
        subtitle: "50 FLORES PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6500,
        subtitle: "70 FLORES PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8300,
        subtitle: "90 FLORES PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1039",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1040,
    categoryId: "rosas",
    baseTitle: "Queen's Garden",
    subtitle: "200 ROSAS + FERRERO + CORONA + LUZ LED",
    description: "Queen's Garden: arreglo floral premium elaborado con 200 rosas + ferrero + corona + luz led. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 2900,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_40.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 7800,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 9500,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 12200,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1040",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1041,
    categoryId: "gerberas",
    baseTitle: "Heart of Colors",
    subtitle: "50 GERBERAS DE COLORES PREMIUM",
    description: "Heart of Colors: arreglo floral premium elaborado con 50 gerberas de colores premium. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 1600,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_41.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 5700,
        subtitle: "60 ROSAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 7000,
        subtitle: "80 ROSAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 9000,
        subtitle: "100 ROSAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1041",
    menuAssignments: [
      {
        groupId: "gerberas",
        subcategory: "GERBERAS",
      },
    ],
    ui: {
      showBadge: true,
      showDeliveryDate: false,
      showColorDots: false,
      showProductSizes: true,
      showStandard: false,
      showPremium: false,
      showLuxury: false,
    },
  },
  {
    id: 1042,
    categoryId: "rosas",
    baseTitle: "Royal Love",
    subtitle: "300 ROSAS + 4 LETRAS",
    description: "Royal Love: arreglo floral premium elaborado con 300 rosas + 4 letras. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 4100,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_46.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 750,
        subtitle: "50 ROSAS ROJAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6500,
        subtitle: "100 ROSAS ROJAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8300,
        subtitle: "100 ROSAS ROJAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1042",
    menuAssignments: [
      {
        groupId: "rosas",
        subcategory: "ROSAS",
      },
    ],
    ui: {
  showBadge: true,
  showDeliveryDate: false,
  showColorDots: false,
  showProductSizes: false,
  showStandard: false,
  showPremium: false,
  showLuxury: false,
},
  },
  {
    id: 1043,
    categoryId: "combinados",
    baseTitle: "Romance Royale",
    subtitle: "50 ROSAS + PELUCHE + 5 GLOBOS HELIO",
    description: "Romance Royale: arreglo floral premium elaborado con 50 rosas + peluche + 5 globos helio. Su presentación elegante lo convierte en un regalo especial para cumpleaños, aniversarios, celebraciones y momentos inolvidables.",
    includes: [
      "Decoración  y diseño similares a la imagen",
      "Tarjeta para escribir dedicatoria",
      "Garantía de entrega segura",
    ],
    deliveryZones: [
      "San Mateo Atenco",
      "Metepec",
      "Lerma",
      "Toluca y Alrededores",
    ],
    isAvailable: true,
    badgeLabel: "EXCLUSIVO",
    basePriceMxn: 2150,
    defaultImages: [
      "/images/tenants/cielitodeflores/catalog/cielitodeflores_47.jpg",
    ],
    activeSizeOptions: [],
    productSizes: [
      {
        id: "estandar",
        label: "ESTÁNDAR",
        priceMxn: 750,
        subtitle: "50 ROSAS ROJAS PREMIUM",
      },
      {
        id: "premium",
        label: "PREMIUM",
        priceMxn: 6500,
        subtitle: "100 ROSAS ROJAS PREMIUM",
      },
      {
        id: "luxury",
        label: "LUXURY",
        priceMxn: 8300,
        subtitle: "100 ROSAS ROJAS PREMIUM",
      },
    ],
    colorDots: [],
    badge: "",
    deliveryMessage: "",
    sku: "VIP-1043",
    menuAssignments: [
      {
        groupId: "combinados",
        subcategory: "COMBINADOS",
      },
    ],
    ui: {
  showBadge: true,
  showDeliveryDate: false,
  showColorDots: false,
  showProductSizes: false,
  showStandard: false,
  showPremium: false,
  showLuxury: false,
},
  },
];
/* ============================================================
 * HELPERS
 * ============================================================
 */
export function buildCardUiMeta(productId: number): CatalogProduct {
  const product = catalogProducts.find((item) => item.id === productId);
  if (!product) {
    throw new Error(`Missing catalog data for product ${productId}`);
  }
  return product;
}
