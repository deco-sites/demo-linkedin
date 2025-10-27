import type { ProductListingPage } from "apps/commerce/types.ts";
import { mapProductToAnalyticsItem } from "apps/commerce/utils/productToAnalyticsItem.ts";
import ProductCard from "../../components/product/ProductCard.tsx";
import Filters from "../../components/search/Filters.tsx";
import Icon from "../../components/ui/Icon.tsx";
import { clx } from "../../sdk/clx.ts";
import { useId } from "../../sdk/hooks/useId.ts";
import { useOffer } from "../../sdk/hooks/useOffer.ts";
import { useSendEvent } from "../../sdk/hooks/useSendEvent.ts";
import { usePlatform } from "../../sdk/hooks/usePlatform.tsx";
import Breadcrumb from "../ui/Breadcrumb.tsx";
import Drawer from "../ui/Drawer.tsx";
import Sort from "../../islands/listingPage/Sort.tsx";
import { useDevice, usePartialSection } from "@deco/deco/hooks";
import { type SectionProps } from "@deco/deco";
import ShowMoreButton from "../../islands/listingPage/ShowMoreButton.tsx";

export interface Layout {
  /**
   * @title Pagination
   * @description Format of the pagination
   */
  pagination?: "show-more" | "pagination";
}
export interface Props {
  /** @title Integration */
  page: ProductListingPage | null;
  /**
   * @title Layout
   * @description Layout of the search result
   */
  layout?: Layout;
  /** @description 0 for ?page=0 as your first page */
  startingPage?: 0 | 1;
  /** @hidden */
  partial?: boolean;
}
function NotFound() {
  return (
    <div class="w-full flex justify-center items-center py-10">
      <span>Not Found!</span>
    </div>
  );
}
const useUrlRebased = (overrides: string | undefined, base: string) => {
  let url: string | undefined = undefined;
  if (overrides) {
    const temp = new URL(overrides, base);
    const final = new URL(base);
    final.pathname = temp.pathname;
    for (const [key, value] of temp.searchParams.entries()) {
      final.searchParams.set(key, value);
    }
    final.searchParams.set("partial", "true");
    url = final.href;
  }
  return url;
};
function PageResult(props: SectionProps<typeof loader>) {
  const { layout, startingPage = 0, url } = props;
  const page = props.page!;
  const { products, pageInfo } = page;
  const perPage = pageInfo?.recordPerPage || products.length;
  const zeroIndexedOffsetPage = pageInfo.currentPage - startingPage;
  const offset = zeroIndexedOffsetPage * perPage;
  const nextPageUrl = useUrlRebased(pageInfo.nextPage, url);
  const prevPageUrl = useUrlRebased(pageInfo.previousPage, url);
  const infinite = layout?.pagination !== "pagination";
  const platform = usePlatform();
  return (
    <div class="grid grid-flow-row grid-cols-1 place-items-center">
      <div
        data-product-list={pageInfo.currentPage}
        class={clx(
          "grid items-center",
          "grid-cols-2 gap-2",
          "sm:grid-cols-4",
          "w-full",
        )}
      >
        {products?.map((product, index) => (
          <ProductCard
            key={`product-card-${product.productID}`}
            product={product}
            preload={index === 0}
            index={offset + index}
            class="h-full min-w-[160px] w-full"
            platform={platform}
          />
        ))}
      </div>
      {infinite
        ? (
          <ShowMoreButton productsPerPage={perPage}>
            <div class="flex justify-center [&_section]:contents pt-2 sm:pt-10 w-full">
              {nextPageUrl && (
                <button
                  class="btn btn-ghost"
                  {...usePartialSection({
                    href: nextPageUrl,
                    mode: "append",
                  })}
                >
                  <span class="inline">
                    Show More
                  </span>
                </button>
              )}
            </div>
          </ShowMoreButton>
        )
        : (
          <div
            class={clx("join", infinite && "hidden", "pt-2 sm:pt-10 w-full")}
          >
            <a
              rel="prev"
              aria-label="previous page link"
              href={prevPageUrl ?? "#"}
              disabled={!prevPageUrl}
              class="btn btn-ghost join-item"
            >
              <Icon id="chevron-right" class="rotate-180" />
            </a>
            <span class="btn btn-ghost join-item">
              Page {zeroIndexedOffsetPage + 1}
            </span>
            <a
              rel="next"
              aria-label="next page link"
              href={nextPageUrl ?? "#"}
              disabled={!nextPageUrl}
              class="btn btn-ghost join-item"
            >
              <Icon id="chevron-right" />
            </a>
          </div>
        )}
    </div>
  );
}

function Result(props: SectionProps<typeof loader>) {
  const container = useId();
  const controls = useId();
  const device = useDevice();
  const { startingPage = 0, url, partial } = props;
  const page = props.page!;
  const { products, filters, breadcrumb, pageInfo, sortOptions } = page;
  const perPage = pageInfo?.recordPerPage || products.length;
  const zeroIndexedOffsetPage = pageInfo.currentPage - startingPage;
  const offset = zeroIndexedOffsetPage * perPage;
  const viewItemListEvent = useSendEvent({
    on: "view",
    event: {
      name: "view_item_list",
      params: {
        // TODO: get category name from search or cms setting
        item_list_name: breadcrumb.itemListElement?.at(-1)?.name,
        item_list_id: breadcrumb.itemListElement?.at(-1)?.item,
        items: page.products?.map((product, index) =>
          mapProductToAnalyticsItem({
            ...(useOffer(product.offers)),
            index: offset + index,
            product,
            breadcrumbList: page.breadcrumb,
          })
        ),
      },
    },
  });
  const results = (
    <span class="text-sm font-normal" data-results-count>
      {page.pageInfo.recordPerPage} of {page.pageInfo.records} results
    </span>
  );
  const sortBy = sortOptions.length > 0 && (
    <Sort sortOptions={sortOptions} url={url} />
  );
  return (
    <>
      <div id={container} {...viewItemListEvent} class="w-full">
        {partial
          ? (
            <div class="px-4 flex flex-col gap-4 sm:gap-5 w-full sm:pb-2">
              <div class="grid grid-cols-1 sm:grid-cols-[250px_1fr] gap-2">
                <div class="">
                </div>
                <PageResult {...props} />
              </div>
            </div>
          )
          : (
            <div class="px-4 flex flex-col gap-4 sm:gap-5 w-full max-sm:py-4 sm:pt-5 sm:pb-2">
              <Breadcrumb itemListElement={breadcrumb?.itemListElement} />

              {device === "mobile" && (
                <Drawer
                  id={controls}
                  aside={
                    <div class="bg-base-100 flex flex-col h-full divide-y overflow-y-hidden">
                      <div class="flex justify-between items-center">
                        <h1 class="px-4 py-3">
                          <span class="font-medium text-2xl">Filters</span>
                        </h1>
                        <label class="btn btn-ghost" for={controls}>
                          <Icon id="close" />
                        </label>
                      </div>
                      <div class="flex-grow overflow-auto">
                        <Filters filters={filters} />
                      </div>
                    </div>
                  }
                >
                  <div class="flex sm:hidden justify-between items-end">
                    <div class="flex flex-col">
                      {results}
                      {sortBy}
                    </div>

                    <label class="btn btn-ghost" for={controls}>
                      Filters
                    </label>
                  </div>
                </Drawer>
              )}

              <div class="grid grid-cols-1 sm:grid-cols-[250px_1fr] gap-2">
                {device === "desktop" && (
                  <aside class="place-self-start flex flex-col gap-2 w-full">
                    <span class="text-base h-12 flex items-center">
                      Filters
                    </span>
                    <div class="background rounded-lg p-4 2xl:max-h-[1400px] xl:max-h-[1000px] lg:max-h-[800px] md:max-h-[600px] sm:max-h-[400px] overflow-y-scroll">
                      <Filters filters={filters} />
                    </div>
                  </aside>
                )}

                <div class="flex flex-col gap-2">
                  {device === "desktop" && (
                    <div class="flex justify-between items-center">
                      {results}
                      <div>
                        {sortBy}
                      </div>
                    </div>
                  )}
                  <PageResult {...props} />
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
}
function SearchResult({ page, ...props }: SectionProps<typeof loader>) {
  if (!page) {
    return <NotFound />;
  }
  return <Result {...props} page={page} />;
}
export const loader = (props: Props, req: Request) => {
  const url = new URL(req.url);
  const partialFromUrl = url.searchParams.get("partial");
  return {
    ...props,
    url: req.url,
    partial: props.partial ?? partialFromUrl === "true",
  };
};
export default SearchResult;
