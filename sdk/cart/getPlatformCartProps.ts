import type { Product } from "apps/commerce/types.ts";

// Platform-specific cart props types
export interface VTEXCartProps {
  allowedOutdatedData: string[];
  orderItems: Array<{
    quantity: number;
    seller: string;
    id: string;
  }>;
}

export interface ShopifyCartProps {
  lines: {
    merchandiseId: string;
  };
}

export interface VNDACartProps {
  quantity: number;
  itemId: string;
  attributes: Record<string, string>;
}

export interface WakeCartProps {
  productVariantId: number;
  quantity: number;
}

export interface NuvemshopCartProps {
  quantity: number;
  itemId: number;
  add_to_cart_enhanced: string;
  attributes: Record<string, string>;
}

export interface LinxCartProps {
  ProductID: string;
  SkuID: string;
  Quantity: number;
}

export type PlatformCartProps =
  | VTEXCartProps
  | ShopifyCartProps
  | VNDACartProps
  | WakeCartProps
  | NuvemshopCartProps
  | LinxCartProps;

export function getPlatformCartProps(
  product: Product,
  seller: string,
  platform: string,
): PlatformCartProps {
  const { additionalProperty = [], isVariantOf, productID } = product;
  const productGroupID = isVariantOf?.productGroupID;

  if (platform === "vtex") {
    return {
      allowedOutdatedData: ["paymentData"],
      orderItems: [{ quantity: 1, seller: seller, id: productID }],
    };
  }

  if (platform === "shopify") {
    return {
      lines: { merchandiseId: productID },
    };
  }

  if (platform === "vnda") {
    return {
      quantity: 1,
      itemId: productID,
      attributes: Object.fromEntries(
        additionalProperty.map(({ name, value }) => [name, value]),
      ),
    };
  }

  if (platform === "wake") {
    return {
      productVariantId: Number(productID),
      quantity: 1,
    };
  }

  if (platform === "nuvemshop") {
    return {
      quantity: 1,
      itemId: Number(productGroupID),
      add_to_cart_enhanced: "1",
      attributes: Object.fromEntries(
        additionalProperty.map(({ name, value }) => [name, value]),
      ),
    };
  }

  if (platform === "linx") {
    return {
      ProductID: productGroupID!,
      SkuID: productID,
      Quantity: 1,
    };
  }

  throw new Error(`Unsupported platform: ${platform}`);
}
