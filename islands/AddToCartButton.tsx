import { useState } from "preact/hooks";
import { JSX } from "preact";
import type { AnalyticsItem, Product } from "apps/commerce/types.ts";
import { state as storeState } from "../sdk/context.ts";
import { clx } from "../sdk/clx.ts";
import { getPlatformCartProps } from "../sdk/cart/getPlatformCartProps.ts";

export interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  product: Product;
  seller: string;
  item: AnalyticsItem;
  platform: string;
  children?: JSX.Element;
}

export default function AddToCartButton({
  product,
  seller,
  item,
  platform,
  class: _class,
  children,
  ...props
}: Props) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      const platformProps = getPlatformCartProps(product, seller, platform);
      await storeState.addToCart(item, platformProps);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      // You could show a toast notification here
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      type="button"
      class={clx("flex-grow", _class?.toString())}
      onClick={handleAddToCart}
      disabled={isAdding || storeState.loading.value}
      {...props}
    >
      {isAdding || storeState.loading.value
        ? <span class="loading loading-spinner loading-sm" />
        : children}
    </button>
  );
}
