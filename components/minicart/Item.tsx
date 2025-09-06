import { AnalyticsItem } from "apps/commerce/types.ts";
import Image from "apps/website/components/Image.tsx";
import { clx } from "../../sdk/clx.ts";
import { formatPrice } from "../../sdk/format.ts";
import Icon from "../ui/Icon.tsx";
import QuantitySelector from "../ui/QuantitySelector.tsx";
import { useScript } from "@deco/deco/hooks";
export type Item = AnalyticsItem & {
  listPrice: number;
  image: string;
};
export interface Props {
  item: Item;
  index: number;
  locale: string;
  currency: string;
}
const QUANTITY_MAX_VALUE = 100;
const removeItemHandler = () => {
  const itemID = (event?.currentTarget as HTMLButtonElement | null)
    ?.closest("fieldset")
    ?.getAttribute("data-item-id");
  if (typeof itemID === "string") {
    window.STOREFRONT.CART.setQuantity(itemID, 0);
  }
};
function CartItem({ item, index, locale, currency }: Props) {
  const { image, price = Infinity, quantity } = item;
  const isGift = price < 0.01;
  // deno-lint-ignore no-explicit-any
  const name = (item as any).item_name;
  return (
    <fieldset
      // deno-lint-ignore no-explicit-any
      data-item-id={(item as any).item_id}
      class="grid grid-rows-1 gap-2"
      style={{ gridTemplateColumns: "auto 1fr" }}
    >
      <div class="p-4 background rounded-lg w-24">
        <Image
          alt={name}
          src={image}
          style={{ aspectRatio: "108 / 150" }}
          width={150}
          height={150}
          class="h-full object-contain"
        />
      </div>

      {/* Info */}
      <div class="flex flex-col justify-between gap-2">
        {/* Name and Remove button */}
        <div class="flex justify-between items-center">
          <legend class="text-xs">{name}</legend>
          <button
            type="button"
            class={clx(
              isGift && "hidden",
              "btn btn-ghost btn-square no-animation",
            )}
            hx-on:click={useScript(removeItemHandler)}
          >
            <Icon id="trash" size={24} />
          </button>
        </div>

        {/* Price Block */}
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm">
            {isGift ? "Grátis" : formatPrice(price, currency, locale)}
          </span>
          {/* Quantity Selector */}
          <div class={clx(isGift && "hidden")}>
            <QuantitySelector
              min={0}
              max={QUANTITY_MAX_VALUE}
              value={quantity}
              name={`item::${index}`}
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
export default CartItem;
