import { ProductDetailsPage } from "apps/commerce/types.ts";
import ImageGallerySlider from "../../components/product/Gallery.tsx";
import ProductInfo from "../../components/product/ProductInfo.tsx";
import Breadcrumb from "../../components/ui/Breadcrumb.tsx";
import Section from "../../components/ui/Section.tsx";
import { clx } from "../../sdk/clx.ts";

export interface Props {
  /** @title Integration */
  page: ProductDetailsPage | null;
}

export default function ProductDetails({ page }: Props) {
  /**
   * Rendered when a not found is returned by any of the loaders run on this page
   */
  if (!page) {
    return (
      <div class="w-full flex justify-center items-center py-28">
        <div class="flex flex-col items-center justify-center gap-6">
          <span class="font-medium text-2xl">Page not found</span>
          <a href="/" class="btn no-animation">
            Go back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-4 sm:gap-5 w-full px-5 sm:px-0">
      <div class="hidden">
        <Breadcrumb itemListElement={page.breadcrumbList.itemListElement} />
      </div>
      <div
        class={clx(
          "relative",
        )}
      >
        <div class="sm:col-span-2 absolute flex items-center top-0 left-0 z-10 bg-gradient-to-r from-white to-transparent h-[885px] px-10">
          <ProductInfo page={page} />
        </div>
        <div class="w-full">
          <ImageGallerySlider page={page} />
        </div>
      </div>
    </div>
  );
}

export const LoadingFallback = () => <Section.Placeholder height="635px" />;
