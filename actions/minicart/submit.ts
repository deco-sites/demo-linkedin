import { type AppContext } from "../../apps/site.ts";
import { type Minicart } from "../../sdk/types.ts";
import { usePlatform } from "../../sdk/usePlatform.tsx";

import linx from "../../sdk/cart/linx/submit.ts";
import vnda from "../../sdk/cart/vnda/submit.ts";
import wake from "../../sdk/cart/wake/submit.ts";
import vtex from "../../sdk/cart/vtex/submit.ts";
import shopify from "../../sdk/cart/shopify/submit.ts";
import nuvemshop from "../../sdk/cart/nuvemshop/submit.ts";

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

interface CartForm {
  items: number[];
  coupon: string | null;
  action: string | null;
  platformCart: unknown;
  addToCart: PlatformCartProps | null;
}

const actions: Record<string, CartSubmitActions> = {
  vtex: vtex as CartSubmitActions,
  vnda: vnda as CartSubmitActions,
  wake: wake as CartSubmitActions,
  linx: linx as CartSubmitActions,
  shopify: shopify as CartSubmitActions,
  nuvemshop: nuvemshop as CartSubmitActions,
};

export interface CartSubmitActions<AC = unknown> {
  addToCart?: (props: CartForm, req: Request, ctx: AC) => Promise<Minicart>;
  setQuantity?: (props: CartForm, req: Request, ctx: AC) => Promise<Minicart>;
  setCoupon?: (props: CartForm, req: Request, ctx: AC) => Promise<Minicart>;
}

// New interface for direct props
interface CartActionProps {
  action: "add-to-cart" | "set-quantity" | "set-coupon";
  addToCart?: PlatformCartProps;
  items?: Record<string, number>;
  coupon?: string;
}

async function action(
  props: CartActionProps,
  req: Request,
  ctx: AppContext,
): Promise<Minicart> {
  const { setQuantity, setCoupon, addToCart } = actions[usePlatform()];

  const form: CartForm = {
    items: props.items ? Object.values(props.items) : [],
    coupon: props.coupon || null,
    action: props.action,
    platformCart: null,
    addToCart: props.addToCart || null,
  };

  const handler = form.action === "set-coupon"
    ? setCoupon
    : form.action === "add-to-cart"
    ? addToCart
    : setQuantity;

  if (!handler) {
    throw new Error(`Unsupported action on platform ${usePlatform()}`);
  }

  return await handler(form, req, ctx);
}

export default action;
