import { Product } from "apps/commerce/types.ts";
import { createHttpClient } from "apps/utils/http.ts";
import { VTEXCommerceStable } from "apps/vtex/utils/client.ts";
import { removeDirtyCookies } from "apps/utils/normalize.ts";
import { fetchSafe } from "apps/vtex/utils/fetchVTEX.ts";
import { AppContext } from "../apps/site.ts";
import ProductSlider from "../components/product/ProductSlider.tsx";
import { AppContext as VtexContext } from "apps/vtex/mod.ts";
import { toProduct } from "apps/vtex/utils/transform.ts";

export default function Shelf({ products }: { products: Product[] | null }) {
  if (!products || products.length === 0) {
    return <div>No products found</div>;
  }

  return (
    <div>
      <ProductSlider products={products} />
    </div>
  );
}

export const loader = async (
  props: unknown,
  req: Request,
  ctx: AppContext & VtexContext,
) => {
  const url = new URL(req.url);
  const accountName = url.searchParams.get("accountName");
  const term = url.searchParams.get("term");

  const vcsDeprecated = createHttpClient<VTEXCommerceStable>({
    base: `https://${accountName}.myvtex.com/`,
    processHeaders: removeDirtyCookies,
    fetcher: fetchSafe,
  });

  const baseUrl = `https://${accountName}.myvtex.com/`;

  const vtexProducts = await vcsDeprecated
    ["GET /api/catalog_system/pub/products/search/:term?"]({
      _from: 0,
      _to: 8,
      ft: term || " ",
    })
    .then((res) => res.json());

  const products = vtexProducts.map((p) =>
    toProduct(p, p.items[0], 0, {
      baseUrl: baseUrl,
      priceCurrency: "BRL",
    })
  );

  return {
    products,
  };
};

export const ErrorFallback = () => {
  return <div class="w-full h-[400px] flex justify-center items-center">
    <div class="skeleton h-8 w-48 rounded-sm"></div>
  </div>;
};
