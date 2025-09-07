import { ProductDetailsPage } from "apps/commerce/types.ts";
import Image from "apps/website/components/Image.tsx";
import ProductImageZoom from "./ProductImageZoom.tsx";
import Icon from "../ui/Icon.tsx";
import { clx } from "../../sdk/clx.ts";
import { useId } from "../../sdk/useId.ts";

export interface Props {
  /** @title Integration */
  page: ProductDetailsPage | null;
}

const WIDTH = 606;
const HEIGHT = 825;
const ASPECT_RATIO = `${WIDTH} / ${HEIGHT}`;

/**
 * @title Product Image Slider
 * @description Creates a three columned grid on destkop, one for the dots preview, one for the image slider and the other for product info
 * On mobile, there's one single column with 3 rows. Note that the orders are different from desktop to mobile, that's why
 * we rearrange each cell with col-start- directives
 */
export default function GallerySlider(props: Props) {
  const id = useId();
  const zoomId = `${id}-zoom`;

  if (!props.page) {
    throw new Error("Missing Product Details Page Info");
  }

  const { page: { product: { name, isVariantOf, image: pImages } } } = props;

  // Filter images when image's alt text matches product name
  // More info at: https://community.shopify.com/c/shopify-discussions/i-can-not-add-multiple-pictures-for-my-variants/m-p/2416533
  const groupImages = isVariantOf?.image ?? pImages ?? [];
  const filtered = groupImages.filter((img) =>
    name?.includes(img.alternateName || "")
  );
  
  const isSmartphone = name?.includes("Smartphone") || isVariantOf?.name?.includes("Smartphone");
  console.log(isSmartphone);
  const images = isSmartphone ? (filtered.length > 0 ? filtered : groupImages).toSpliced(1, 2).toSpliced(-2, 2) : (filtered.length > 0 ? filtered : groupImages);

  return (
    <>
      <div
        id={id}
        class=""
      >
        {/* Image Slider */}
        <div class="col-start-1 col-span-1 sm:col-start-2">
          <div class="overflow-x-auto overflow-y-hidden w-full max-w-[100vw]">
            <div class="flex gap-4 pl-[calc(33.333333vw)] w-max">
              {images.map((img, index) => (
                <div class={clx(
                  "flex items-center w-[543px]  bg-[#EEEEEE] rounded-lg h-[885px]",
                  isSmartphone && "px-20"
                )}>
                  <Image
                    class="w-full"
                    sizes="(max-width: 640px) 100vw, 40vw"
                    style={{ aspectRatio: ASPECT_RATIO }}
                    src={img.url!}
                    alt={img.alternateName}
                    width={WIDTH}
                    height={HEIGHT}
                    // Preload LCP image for better web vitals
                    preload={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>

            <div class="absolute top-2 right-2 bg-base-100 rounded-full hidden">
              <label class="btn btn-ghost hidden sm:inline-flex" for={zoomId}>
                <Icon id="pan_zoom" />
              </label>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div class="hidden col-start-1 col-span-1">
          <ul
            class={clx(
              "flex flex-col",
              "gap-2",
              "max-w-full",
              "overflow-y-auto",
            )}
            style={{ maxHeight: "600px" }}
          >
            {images.map((img, index) => (
              <li class="w-16 h-16" key={index}>
                <button type="button" class="w-full h-full">
                  <Image
                    style={{ aspectRatio: "1 / 1" }}
                    class="border rounded object-cover w-full h-full hover:border-base-400"
                    width={64}
                    height={64}
                    src={img.url!}
                    alt={img.alternateName}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ProductImageZoom
        id={zoomId}
        images={images}
        width={700}
        height={Math.trunc(700 * HEIGHT / WIDTH)}
      />
    </>
  );
}
