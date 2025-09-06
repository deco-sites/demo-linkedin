import { AnalyticsItem, Product } from "apps/commerce/types.ts";
import { JSX } from "preact";
import { clx } from "../../sdk/clx.ts";
import { useId } from "../../sdk/useId.ts";
import { usePlatform } from "../../sdk/usePlatform.tsx";

import { useScript } from "@deco/deco/hooks";
export interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  product: Product;
  seller: string;
  item: AnalyticsItem;
  children?: JSX.Element;
}
const onClick = () => {
  event?.stopPropagation();
  const button = event?.currentTarget as HTMLButtonElement | null;
  const container = button!.closest<HTMLDivElement>("div[data-cart-item]")!;
  const { item, platformProps } = JSON.parse(
    decodeURIComponent(container.getAttribute("data-cart-item")!),
  );
  window.STOREFRONT.CART.addToCart(item, platformProps);
};

const useAddToCart = ({ product, seller }: Props) => {
  const platform = usePlatform();
  const { additionalProperty = [], isVariantOf, productID } = product;
  const productGroupID = isVariantOf?.productGroupID;
  if (platform === "vtex") {
    return {
      allowedOutdatedData: ["paymentData"],
      orderItems: [{ quantity: 1, seller: seller, id: productID }],
    };
  }
  if (platform === "shopify") {
    return { lines: { merchandiseId: productID } };
  }
  if (platform === "vnda") {
    return {
      quantity: 1,
      itemId: productID,
      attributes: Object.fromEntries(
        additionalProperty.map(({ name, value }) => [name, value]),
      ),
    };
  }
  if (platform === "wake") {
    return {
      productVariantId: Number(productID),
      quantity: 1,
    };
  }
  if (platform === "nuvemshop") {
    return {
      quantity: 1,
      itemId: Number(productGroupID),
      add_to_cart_enhanced: "1",
      attributes: Object.fromEntries(
        additionalProperty.map(({ name, value }) => [name, value]),
      ),
    };
  }
  if (platform === "linx") {
    return {
      ProductID: productGroupID,
      SkuID: productID,
      Quantity: 1,
    };
  }
  return null;
};
function AddToCartButton(props: Props) {
  const { product, item, class: _class, children } = props;
  const platformProps = useAddToCart(props);
  const id = useId();
  return (
    <div
      id={id}
      class="flex"
      data-item-id={product.productID}
      data-cart-item={encodeURIComponent(
        JSON.stringify({ item, platformProps }),
      )}
    >
      <button
        type="button"
        class={clx("flex-grow", _class?.toString())}
        hx-on:click={useScript(onClick)}
      >
        {children}
      </button>
    </div>
  );
}
export default AddToCartButton;
