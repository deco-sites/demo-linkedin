import { useEffect, useState } from "preact/hooks";
import { state as storeState } from "../sdk/context.ts";
import { MINICART_DRAWER_ID } from "../constants.ts";
import { clx } from "../sdk/clx.ts";
import { formatPrice } from "../sdk/format.ts";
import CartItem from "../components/minicart/Item.tsx";
import Coupon from "../components/minicart/Coupon.tsx";
import FreeShippingProgressBar from "../components/minicart/FreeShippingProgressBar.tsx";

export default function MinicartContent(
  { freeShippingTarget: _freeShippingTarget }: { freeShippingTarget?: number },
) {
  const [cart, setCart] = useState(storeState.cart.value);

  useEffect(() => {
    // Subscribe to cart changes
    const unsubscribe = storeState.cart.subscribe((newCart) => {
      setCart(newCart);
    });

    // Initial update
    setCart(storeState.cart.value);

    return unsubscribe;
  }, []);

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    await storeState.updateQuantity(itemId, quantity);
  };

  const handleCouponChange = async (coupon: string) => {
    await storeState.updateCoupon(coupon);
  };

  const handleCheckout = () => {
    // Dispatch analytics event
    if (typeof window !== "undefined" && window.DECO?.events && cart) {
      window.DECO.events.dispatch({
        name: "begin_checkout",
        params: storeState.cart.value,
      });
    }
  };

  const {
    storefront: {
      items = [],
      total = 0,
      subtotal = 0,
      coupon = undefined,
      discounts = 0,
      locale = "pt-BR",
      currency = "BRL",
      enableCoupon = true,
      freeShippingTarget = 0,
      checkoutHref = "#",
    } = {},
  } = cart || {};

  const count = items.length;

  return (
    <div
      class={clx(
        "flex flex-col flex-grow justify-center items-center overflow-hidden w-full",
        storeState.loading.value &&
          "pointer-events-none opacity-60 cursor-wait transition-opacity duration-300",
      )}
    >
      {count === 0
        ? (
          <div class="flex flex-col gap-6">
            <span class="font-medium text-2xl">Your bag is empty</span>
            <label
              for={MINICART_DRAWER_ID}
              class="btn btn-outline no-animation"
            >
              Choose products
            </label>
          </div>
        )
        : (
          <>
            {/* Free Shipping Bar */}
            <div class="px-2 py-4 w-full">
              <FreeShippingProgressBar
                total={total}
                locale={locale}
                currency={currency}
                target={_freeShippingTarget ?? freeShippingTarget ?? 0}
              />
            </div>

            {/* Cart Items */}
            <ul
              role="list"
              class="mt-6 px-2 flex-grow overflow-y-auto flex flex-col gap-6 w-full"
            >
              {items.map((item, index) => (
                <li key={index}>
                  <CartItem
                    item={item}
                    index={index}
                    locale={locale}
                    currency={currency}
                    onQuantityChange={handleQuantityChange}
                  />
                </li>
              ))}
            </ul>

            {/* Cart Footer */}
            <footer class="w-full">
              {/* Subtotal */}
              <div class="border-t border-base-200 py-2 flex flex-col">
                {discounts > 0 && (
                  <div class="flex justify-between items-center px-4">
                    <span class="text-sm">Discounts</span>
                    <span class="text-sm">
                      {formatPrice(discounts, currency, locale)}
                    </span>
                  </div>
                )}
                <div class="w-full flex justify-between px-4 text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal, currency, locale)}</span>
                </div>
                {enableCoupon && (
                  <Coupon
                    coupon={coupon}
                    onCouponChange={handleCouponChange}
                  />
                )}
              </div>

              {/* Total */}
              <div class="border-t border-base-200 pt-4 flex flex-col justify-end items-end gap-2 mx-4">
                <div class="flex justify-between items-center w-full">
                  <span>Total</span>
                  <span class="font-medium text-xl">
                    {formatPrice(total, currency, locale)}
                  </span>
                </div>
                <span class="text-sm text-base-300">
                  Fees and shipping will be calculated at checkout
                </span>
              </div>

              <div class="p-4">
                <a
                  class="btn btn-primary w-full no-animation"
                  href={checkoutHref}
                  onClick={handleCheckout}
                >
                  <span class={storeState.loading.value ? "hidden" : ""}>
                    Begin Checkout
                  </span>
                  <span class={storeState.loading.value ? "inline" : "hidden"}>
                    <span class="loading loading-spinner" />
                  </span>
                </a>
              </div>
            </footer>
          </>
        )}
    </div>
  );
}
