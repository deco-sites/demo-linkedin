// Browser stub for apps/* imports
// These types are only needed at compile time, not runtime

export interface Product {
  "@type": "Product";
  productID: string;
  name: string;
  url?: string;
  description?: string;
  image?: Array<{ url: string; alternateName?: string }>;
  offers?: {
    lowPrice: number;
    highPrice: number;
    priceCurrency: string;
    offers: Array<{
      price: number;
      listPrice?: number;
      availability: string;
    }>;
  };
  isVariantOf?: {
    name: string;
    productGroupID: string;
  };
}

export interface Person {
  "@type": "Person";
  email?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
}

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
}

// Stub image widget type
export type ImageWidget = string;

// Stub for any other apps/ types
export type RichText = string;

