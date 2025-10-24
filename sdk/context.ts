import { IS_BROWSER } from "$fresh/runtime.ts";
import { signal } from "@preact/signals";
import { withManifest } from "deco/clients/withManifest.ts";
import type { Manifest } from "../manifest.gen.ts";
import type { Wishlist } from "./types.ts";
import type { AnalyticsItem, Person } from "apps/commerce/types.ts";
import type { PlatformCartProps } from "./cart/getPlatformCartProps.ts";
import { Minicart } from "./types.ts";

interface Context {
  cart: Minicart;
  wishlist: Wishlist | null;
  user: Person | null;
}

const Runtime = withManifest<Manifest>();
const loading = signal<boolean>(true);
const context = {
  cart: signal<Minicart | undefined>(undefined),
  wishlist: signal<Wishlist | null>(null),
  user: signal<Person | null>(null),
};

interface EnqueueOptions {
  isInitialLoader?: boolean;
}

let queue = Promise.resolve();
let abort = () => {};
const enqueue = (
  cb: (signal: AbortSignal) => Promise<Partial<Context>> | Partial<Context>,
  options?: EnqueueOptions,
) => {
  abort();

  loading.value = true;
  const controller = new AbortController();

  queue = queue.then(async () => {
    try {
      const { cart, wishlist, user } = await cb(controller.signal);

      if (controller.signal.aborted) {
        throw { name: "AbortError" };
      }

      if (cart) {
        context.cart.value = cart;
      }

      if (wishlist !== undefined) {
        context.wishlist.value = wishlist;
      }

      // Updating user context just on initial load because the enqueue function
      // is used for modify the cart and no user is returned when this occurs
      if (options?.isInitialLoader && user !== undefined) {
        context.user.value = user;
      }

      loading.value = false;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;

      console.error(error);
      loading.value = false;
    }
  });

  abort = () => controller.abort();

  return queue;
};

const load = async (signal: AbortSignal) => {
  const { cart, wishlist, user } = await Runtime.invoke({
    cart: {
      key: "site/loaders/minicart.ts",
    },
    wishlist: {
      key: "site/loaders/wishlist.ts",
    },
    user: {
      key: "site/loaders/user.ts",
    },
  }, { signal });

  return {
    cart: cart as Minicart,
    wishlist: wishlist as Wishlist | null,
    user: user as Person | null,
  };
};

// Cart operations
const addToCart = async (
  item: AnalyticsItem,
  platformProps: PlatformCartProps,
) => {
  try {
    loading.value = true;

    // Dispatch analytics event
    if (typeof window !== "undefined" && window.DECO?.events) {
      window.DECO.events.dispatch({
        name: "add_to_cart",
        params: { items: [item] },
      });
    }
    const cartData = await Runtime.invoke({
      key: "site/actions/minicart/submit.ts",
      props: {
        action: "add-to-cart",
        addToCart: platformProps,
      },
    });
    context.cart.value = cartData as Minicart;
  } catch (err) {
    console.error("Error adding to cart:", err);
  } finally {
    loading.value = false;
  }
};

const updateQuantity = async (itemId: string, quantity: number) => {
  try {
    loading.value = true;

    const currentCart = context.cart.value;
    if (!currentCart) {
      throw new Error("No cart data available");
    }

    // Create items array with updated quantity
    const items = currentCart.storefront.items.map((item) => {
      // @ts-ignore - item structure varies by platform
      if (item.item_id === itemId) {
        return { ...item, quantity };
      }
      return item;
    });

    // Dispatch analytics event
    if (typeof window !== "undefined" && window.DECO?.events) {
      // @ts-ignore - item structure varies by platform
      const item = items.find((item) => item.item_id === itemId);
      if (item) {
        window.DECO.events.dispatch({
          name: quantity > 0 ? "add_to_cart" : "remove_from_cart",
          params: { items: [{ ...item, quantity }] },
        });
      }
    }

    const cartData = await Runtime.invoke({
      key: "site/actions/minicart/submit.ts",
      props: {
        action: "set-quantity",
        items: Object.fromEntries(
          items.map((item, index) => [`item::${index}`, item.quantity]),
        ),
      },
    });
    context.cart.value = cartData as Minicart;
  } catch (err) {
    console.error("Error updating quantity:", err);
  } finally {
    loading.value = false;
  }
};

const updateCoupon = async (coupon: string) => {
  try {
    loading.value = true;

    const cartData = await Runtime.invoke({
      key: "site/actions/minicart/submit.ts",
      props: {
        action: "set-coupon",
        coupon: coupon,
      },
    });
    context.cart.value = cartData as Minicart;
  } catch (err) {
    console.error("Error updating coupon:", err);
  } finally {
    loading.value = false;
  }
};

// Wishlist operations
const toggleWishlist = async (productID: string, productGroupID: string) => {
  try {
    loading.value = true;

    const wishlistData = await Runtime.invoke({
      key: "site/actions/wishlist/submit.ts",
      props: {
        productID: productID,
        productGroupID: productGroupID,
      },
    });
    context.wishlist.value = wishlistData;
  } catch (err) {
    console.error("Error toggling wishlist:", err);
  } finally {
    loading.value = false;
  }
};

const isInWishlist = (productID: string): boolean => {
  const currentWishlist = context.wishlist.value;
  return currentWishlist?.productIDs.includes(productID) ?? false;
};

if (IS_BROWSER) {
  enqueue(load, { isInitialLoader: true });

  /*   document.addEventListener(
    "visibilitychange",
    () => document.visibilityState === "visible" && enqueue(load),
  ); */
}

export const state = {
  ...context,
  loading,
  enqueue,
  addToCart,
  updateQuantity,
  updateCoupon,
  toggleWishlist,
  isInWishlist,
};
