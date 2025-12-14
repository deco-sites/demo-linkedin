import { Product } from "apps/commerce/types.ts";
import { clx } from "../../sdk/clx.ts";
import Slider from "../ui/Slider.tsx";
import ProductCard from "./ProductCard.tsx";
import { useId } from "../../sdk/hooks/useId.ts";
import { usePlatform } from "../../sdk/hooks/usePlatform.tsx";

interface Props {
  products: Product[] | null;
  itemListName?: string;
}

function ProductSlider({ products, itemListName }: Props) {
  const id = useId();
  const platform = usePlatform();

  // Handle missing or invalid products data (e.g., unresolved loaders)
  if (!products || !Array.isArray(products)) {
    return (
      <div class="flex items-center justify-center p-8 text-gray-500">
        <p>Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div class="flex items-center justify-center p-8 text-gray-500">
        <p>No products found</p>
      </div>
    );
  }

  return (
    <>
      <div
        id={id}
        class="grid grid-rows-1"
        style={{
          gridTemplateColumns: "min-content 1fr min-content",
        }}
      >
        <div class="col-start-1 col-span-3 row-start-1 row-span-1 gap-1">
          <Slider class="carousel carousel-center sm:carousel-end w-full gap-2">
            {products.map((product, index) => (
              <Slider.Item
                index={index}
                class={clx(
                  "carousel-item w-[calc(50%-4px)] sm:w-[calc(33.33%-5.33px)] md:w-[calc(25%-6px)]",
                  "first:pl-5 first:sm:pl-0",
                  "last:pr-5 last:sm:pr-0",
                )}
              >
                <ProductCard
                  index={index}
                  product={product}
                  itemListName={itemListName}
                  class="w-full"
                  platform={platform}
                />
              </Slider.Item>
            ))}
          </Slider>
        </div>
      </div>
      <Slider.JS rootId={id} />
    </>
  );
}

export default ProductSlider;
