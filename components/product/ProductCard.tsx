import type { Product } from "apps/commerce/types.ts";
import { mapProductToAnalyticsItem } from "apps/commerce/utils/productToAnalyticsItem.ts";
import Image from "apps/website/components/Image.tsx";
import { clx } from "../../sdk/clx.ts";
import { formatPrice } from "../../sdk/format.ts";
import { relative } from "../../sdk/url.ts";
import { useOffer } from "../../sdk/useOffer.ts";
import { useSendEvent } from "../../sdk/useSendEvent.ts";
import { useVariantPossibilities } from "../../sdk/useVariantPossiblities.ts";
import WishlistButton from "../wishlist/WishlistButton.tsx";
import AddToCartButton from "./AddToCartButton.tsx";
import { Ring } from "./ProductVariantSelector.tsx";
import { useId } from "../../sdk/useId.ts";

interface Props {
  product: Product;
  /** Preload card image */
  preload?: boolean;

  /** @description used for analytics event */
  itemListName?: string;

  /** @description index of the product card in the list */
  index?: number;

  class?: string;
}

const WIDTH = 287;
const HEIGHT = 287;
const ASPECT_RATIO = `${WIDTH} / ${HEIGHT}`;

function ProductCard({
  product,
  preload,
  itemListName,
  index,
  class: _class,
}: Props) {
  const id = useId();

  const { url, image: images, offers, isVariantOf } = product;
  const hasVariant = isVariantOf?.hasVariant ?? [];
  const title = isVariantOf?.name ?? product.name;
  const [front] = images ?? [];

  const { listPrice, price, seller = "1", availability } = useOffer(offers);
  const inStock = availability === "https://schema.org/InStock";
  const possibilities = useVariantPossibilities(hasVariant, product);
  const firstSkuVariations = Object.entries(possibilities)?.[0];
  const variants = Object.entries(firstSkuVariations?.[1] ?? {});
  const relativeUrl = relative(url);
  const percent = listPrice && price
    ? Math.round(((listPrice - price) / listPrice) * 100)
    : 0;

  const item = mapProductToAnalyticsItem({ product, price, listPrice, index });

  {/* Add click event to dataLayer */}
  const event = useSendEvent({
    on: "click",
    event: {
      name: "select_item" as const,
      params: {
        item_list_name: itemListName,
        items: [item],
      },
    },
  });

  //Added it to check the variant name in the SKU Selector later, so it doesn't render the SKU to "shoes size" in the Product Card
  const firstVariantName = firstSkuVariations?.[0]?.toLowerCase();
  const shoeSizeVariant = "shoe size";

  return (
    <div
      {...event}
      class={clx(
        "rounded-lg bg-[#EEEEEE] group text-sm p-4 pt-20 pb-32 relative",
        _class,
      )}
    >
      <figure
        class={clx(
          "rounded border border-transparent",
        )}
        style={{ aspectRatio: ASPECT_RATIO }}
      >
        {/* Product Images */}
        <a
          href={relativeUrl}
          aria-label="view product"
          class={clx(
            "top-0 left-0",
            "grid grid-cols-1 grid-rows-1",
            "w-full",
          )}
        >
          <Image
            src={front.url!}
            alt={front.alternateName}
            width={WIDTH}
            height={HEIGHT}
            style={{ aspectRatio: ASPECT_RATIO }}
            class={clx(
              "object-cover",
              "rounded w-full",
              "col-span-full row-span-full",
            )}
            sizes="(max-width: 640px) 50vw, 20vw"
            preload={preload}
            loading={preload ? "eager" : "lazy"}
            decoding="async"
          />
        </a>

        {/* Wishlist button */}
        <div class="absolute top-4 left-4 w-full flex items-center justify-between">
          {/* Discounts */}
          <span
            class={clx(
              "bg-base-300 text-xs font-normal text-base-100 text-center rounded-lg px-2 py-1",
              (percent < 1 || !inStock) && "opacity-0",
            )}
          >
            {percent} % off
          </span>
        </div>

        <div class="hidden absolute bottom-0 right-0">
          <WishlistButton item={item} variant="icon" />
        </div>
      </figure>

      <div class="absolute bottom-0 left-0 w-full flex items-end justify-between p-4">
        <div class="pt-5">
          <span class="font-medium text-sm text-base-200">
            {title}
          </span>

          <div class="flex gap-2 pt-1">
            <span class="text-base-400 text-sm text-base-200">
              {formatPrice(price, offers?.priceCurrency)}
            </span>
          </div>
        </div>

        <div class="flex gap-2 items-center justify-between">
          {/* SKU Selector */}
          {false && variants.length > 1 && firstVariantName !== shoeSizeVariant && (
            <ul class="flex items-center justify-start gap-2 overflow-x-auto">
              {variants.map(([value, link]) => [value, relative(link)] as const)
                .map(([value, link]) => (
                  <li>
                    <a href={link} class="cursor-pointer">
                      <input
                        class="hidden peer"
                        type="radio"
                        name={`${id}-${firstSkuVariations?.[0]}`}
                        checked={link === relativeUrl}
                      />
                      <Ring value={value} checked={link === relativeUrl} />
                    </a>
                  </li>
                ))}
            </ul>
          )}
          <div>
            <AddToCartButton
              product={product}
              seller={seller}
              item={item}
              class={clx(
                "flex justify-center items-center border-none !text-sm !font-medium px-0 no-animation w-full",
              )}
            >
              <span class="w-[17px] h-[17px] bg-[#fff] rounded-full flex items-center justify-center">
                +
              </span>
            </AddToCartButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
