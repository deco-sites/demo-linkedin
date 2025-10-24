import { useEffect, useState } from "preact/hooks";
import { state as storeState } from "../sdk/context.ts";
import { clx } from "../sdk/clx.ts";
import Icon from "../components/ui/Icon.tsx";
import { AnalyticsItem } from "apps/commerce/types.ts";

interface Props {
  variant?: "full" | "icon";
  item: AnalyticsItem;
}

export default function WishlistButton({ item, variant = "full" }: Props) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // @ts-ignore - AnalyticsItem structure varies
  const productID = item.item_id;
  // @ts-ignore - AnalyticsItem structure varies
  const productGroupID = item.item_group_id ?? "";

  useEffect(() => {
    // Subscribe to wishlist changes
    const unsubscribe = storeState.wishlist.subscribe((wishlist) => {
      setIsInWishlist(wishlist?.productIDs.includes(productID) ?? false);
    });

    // Initial update
    setIsInWishlist(storeState.isInWishlist(productID));

    return unsubscribe;
  }, [productID]);

  const handleToggle = async () => {
    const user = storeState.user.value;

    if (!user?.email) {
      window.alert("Please login to add the product to your wishlist");
      return;
    }

    try {
      setIsToggling(true);
      await storeState.toggleWishlist(productID, productGroupID);
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      type="button"
      data-wishlist-button
      disabled={isToggling || storeState.loading.value}
      onClick={handleToggle}
      aria-label="Add to wishlist"
      class={clx(
        "background btn btn-primary pl-0 pr-0 btn-sm no-animation flex items-center justify-center",
        variant === "icon" ? "h-8 w-8" : "btn-outline gap-2 w-full",
      )}
    >
      <Icon
        id="favorite"
        class={isToggling || storeState.loading.value ? "hidden" : ""}
        fill={isInWishlist ? "black" : "none"}
        size={12}
      />
      {variant === "full" && (
        <span class={isToggling || storeState.loading.value ? "hidden" : ""}>
          {isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        </span>
      )}
      <span
        class={isToggling || storeState.loading.value ? "inline" : "hidden"}
      >
        <span class="loading loading-spinner" />
      </span>
    </button>
  );
}
