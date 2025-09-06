import type { Product } from "apps/commerce/types.ts";
import ProductSlider from "../../components/product/ProductSlider.tsx";
import Section, {
  Props as SectionHeaderProps,
} from "../../components/ui/Section.tsx";
import { type LoadingFallbackProps } from "@deco/deco";
import { useId } from "../../sdk/useId.ts";
import { clx } from "../../sdk/clx.ts";

/* import { useOffer } from "../../sdk/useOffer.ts";
import { useSendEvent } from "../../sdk/useSendEvent.ts";
import { mapProductToAnalyticsItem } from "apps/commerce/utils/productToAnalyticsItem.ts"; */
export interface Props extends SectionHeaderProps {
  products: Product[] | null;
}
export default function ProductShelf({ products, title, cta }: Props) {
  if (!products || products.length === 0) {
    return null;
  }
  // Analytics event
  /*   const viewItemListEvent = useSendEvent({
    on: "view",
    event: {
      name: "view_item_list",
      params: {
        item_list_name: title,
        items: products.map((product, index) =>
          mapProductToAnalyticsItem({
            index,
            product,
            ...(useOffer(product.offers)),
          })
        ),
      },
    },
  }); */
  return (
    <div class="px-4 py-2">
      <Section.Header title={title} cta={cta} />

      <ProductSlider products={products} itemListName={title} />
    </div>
  );
}
export const LoadingFallback = (
  { title, cta }: LoadingFallbackProps<Props>,
) => {
  const id = useId();

  return (
    <div class="px-4 py-2">
      <Section.Header title={title} cta={cta} />

      <div
        id={id}
        class="grid grid-rows-1"
        style={{
          gridTemplateColumns: "min-content 1fr min-content",
        }}
      >
        <div class="col-start-1 col-span-3 row-start-1 row-span-1 gap-1">
          <div class="carousel carousel-center sm:carousel-end w-full gap-2">
            {Array(6).fill(0).map((_, index) => (
              <div
                key={index}
                class={clx(
                  "carousel-item w-[calc(25%-6px)]",
                  "first:pl-5 first:sm:pl-0",
                  "last:pr-5 last:sm:pr-0",
                )}
              >
                <div class="w-full">
                  <div class="rounded-lg bg-[#EEEEEE] group text-sm p-4 pt-20 pb-32 relative">
                    {/* Product Image Skeleton */}
                    <figure
                      class="rounded border border-transparent"
                      style={{ aspectRatio: "287 / 287" }}
                    >
                      <div class="bg-[#EEEEEE] w-full h-full rounded"></div>
                    </figure>

                    {/* Bottom Content Skeleton */}
                    <div class="absolute bottom-0 left-0 w-full flex items-end justify-between p-4">
                      <div class="pt-5">
                        {/* Product Title Skeleton */}
                        <div class="skeleton h-4 w-32 mb-2"></div>

                        {/* Price Skeleton */}
                        <div class="skeleton h-4 w-20"></div>
                      </div>

                      <div class="flex gap-2 items-center justify-between">
                        {/* SKU Selector Skeleton */}
                        <div class="flex items-center justify-start gap-2">
                          <div class="skeleton h-6 w-6 rounded-full"></div>
                          <div class="skeleton h-6 w-6 rounded-full"></div>
                          <div class="skeleton h-6 w-6 rounded-full"></div>
                        </div>

                        {/* Add to Cart Button Skeleton */}
                        <div>
                          <div class="skeleton h-8 w-8 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
