import { ProductDetailsPage } from "apps/commerce/types.ts";
import { mapProductToAnalyticsItem } from "apps/commerce/utils/productToAnalyticsItem.ts";
import { formatPrice } from "../../sdk/format.ts";
import { useId } from "../../sdk/useId.ts";
import { useOffer } from "../../sdk/useOffer.ts";
import { useSendEvent } from "../../sdk/useSendEvent.ts";
import ShippingSimulationForm from "../shipping/Form.tsx";
import WishlistButton from "../wishlist/WishlistButton.tsx";
import AddToCartButton from "./AddToCartButton.tsx";
import OutOfStock from "./OutOfStock.tsx";
import ProductSelector from "./ProductVariantSelector.tsx";

interface Props {
  page: ProductDetailsPage | null;
}

function ProductInfo({ page }: Props) {
  const id = useId();

  if (page === null) {
    throw new Error("Missing Product Details Page Info");
  }

  const { breadcrumbList, product } = page;
  const { productID, offers, isVariantOf } = product;
  const description = product.description || isVariantOf?.description;
  const title = isVariantOf?.name ?? product.name;

  const {
    price = 0,
    listPrice,
    seller = "1",
    availability,
  } = useOffer(offers);

  const _percent = listPrice && price
    ? Math.round(((listPrice - price) / listPrice) * 100)
    : 0;

  const breadcrumb = {
    ...breadcrumbList,
    itemListElement: breadcrumbList?.itemListElement.slice(0, -1),
    numberOfItems: breadcrumbList.numberOfItems - 1,
  };

  const item = mapProductToAnalyticsItem({
    product,
    breadcrumbList: breadcrumb,
    price,
    listPrice,
  });

  const viewItemEvent = useSendEvent({
    on: "view",
    event: {
      name: "view_item",
      params: {
        item_list_id: "product",
        item_list_name: "Product",
        items: [item],
      },
    },
  });

  //Checks if the variant name is "title"/"default title" and if so, the SKU Selector div doesn't render
  const hasValidVariants = isVariantOf?.hasVariant?.some(
    (variant) =>
      variant?.name?.toLowerCase() !== "title" &&
      variant?.name?.toLowerCase() !== "default title",
  ) ?? false;

  return (
    <div
      {...viewItemEvent}
      class="flex flex-col background-pdp rounded-2xl p-4"
      id={id}
    >
      <div class="flex flex-col gap-2 max-w-[300px]">
        {/* Product Name */}
        <span class="font-medium">
          {title}
        </span>

        {description && (
          <div
            class="text-xs text-base-200"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        <span class="text-sm text-base-400 font-medium">
          {formatPrice(price, offers?.priceCurrency)}
        </span>
      </div>

      {/* Sku Selector */}
      {hasValidVariants && (
        <div className="hidden mt-4 sm:mt-8">
          <ProductSelector product={product} />
        </div>
      )}

      {/* Add to Cart and Favorites button */}
      <div class="mt-4 sm:mt-10 flex flex-col gap-2">
        {availability === "https://schema.org/InStock"
          ? (
            <div class="flex flex-nowrap gap-2">
              <WishlistButton item={item} variant="icon" />
              <AddToCartButton
                item={item}
                seller={seller}
                product={product}
                disabled={false}
                class="background btn btn-primary btn-sm !max-h-8 px-3"
              >
                <span class="text-xs font-normal">
                  Add to cart
                </span>
              </AddToCartButton>
            </div>
          )
          : <OutOfStock productID={productID} />}
      </div>

      {/* Shipping Simulation */}
      <div class="mt-8 hidden">
        <ShippingSimulationForm
          items={[{ id: Number(product.sku), quantity: 1, seller: seller }]}
        />
      </div>
    </div>
  );
}

export default ProductInfo;
