import { useEffect, useState } from "preact/hooks";
import { state as storeState } from "../../sdk/context.ts";
import { MINICART_DRAWER_ID } from "../../constants.ts";

export default function BagButton() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    // Subscribe to cart changes
    const updateCount = () => {
      const count = storeState.cart.value?.storefront.items.length ?? 0;
      setItemCount(count);
    };

    // Initial update
    updateCount();

    // Subscribe to cart signal changes
    const unsubscribe = storeState.cart.subscribe(updateCount);

    return unsubscribe;
  }, []);

  return (
    <label class="indicator" for={MINICART_DRAWER_ID} aria-label="open cart">
      {itemCount > 0 && (
        <span class="indicator-item badge badge-primary badge-sm font-thin">
          {itemCount > 9 ? "9+" : itemCount.toString()}
        </span>
      )}
      <span class="background text-[14px] flex justify-center items-center h-[40px] px-3 rounded-lg cursor-pointer">
        Bag
      </span>
    </label>
  );
}
