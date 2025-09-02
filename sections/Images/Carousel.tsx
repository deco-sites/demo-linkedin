import type { ImageWidget, VideoWidget } from "apps/admin/widgets.ts";
import { Picture, Source } from "apps/website/components/Picture.tsx";
import Icon from "../../components/ui/Icon.tsx";
import Slider from "../../components/ui/Slider.tsx";
import { clx } from "../../sdk/clx.ts";
import { useId } from "../../sdk/useId.ts";
import { useSendEvent } from "../../sdk/useSendEvent.ts";

/**
 * @titleBy alt
 */
export interface Banner {
  /** @description Media type */
  type: "image" | "video";

  /** @description desktop optimized image */
  desktop?: ImageWidget;

  /** @description mobile optimized image */
  mobile?: ImageWidget;

  /** @description video source */
  video?: VideoWidget;

  /** @description Image's/Video's alt text or description */
  alt: string;

  /** @description Video poster image (thumbnail) */
  poster?: ImageWidget;

  /** @description Auto-play video (default: false) */
  autoplay?: boolean;

  /** @description Mute video (default: true) */
  muted?: boolean;

  /** @description Loop video (default: true) */
  loop?: boolean;

  action?: {
    /** @description when user clicks on the media, go to this link */
    href: string;
    /** @description Media text title */
    title: string;
    /** @description Media text subtitle */
    subTitle: string;
    /** @description Button label */
    label: string;
  };
}

export interface Props {
  items?: Banner[];

  /**
   * @description Check this option when this banner is the biggest image on the screen for image optimizations
   */
  preload?: boolean;

  /**
   * @title Autoplay interval
   * @description time (in seconds) to start the carousel autoplay
   */
  interval?: number;
}

function MediaItem(
  { item, lcp }: { item: Banner; lcp?: boolean },
) {
  const {
    type,
    alt,
    mobile,
    desktop,
    video,
    poster,
    autoplay = false,
    muted = true,
    loop = true,
  } = item;

  const viewPromotionEvent = useSendEvent({
    on: "view",
    event: { name: "view_promotion", params: { promotion_name: alt } },
  });

  if (type === "video" && video) {
    return (
      <video
        class="object-cover w-full h-[50vw]"
        autoplay={autoplay}
        muted={muted}
        loop={loop}
        playsInline
        poster={poster}
        preload={lcp ? "auto" : "metadata"}
        {...viewPromotionEvent}
      >
        <source src={video} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }

  // Default to image - ensure we have at least one image source
  const imageSrc = desktop || mobile;
  if (!imageSrc) {
    return (
      <div class="object-cover w-full h-full bg-gray-200 flex items-center justify-center">
        <span class="text-gray-500">No image available</span>
      </div>
    );
  }

  return (
    <Picture preload={lcp} {...viewPromotionEvent}>
      <Source
        media="(max-width: 767px)"
        fetchPriority={lcp ? "high" : "auto"}
        src={mobile || desktop!}
        width={412}
        height={660}
      />
      <Source
        media="(min-width: 768px)"
        fetchPriority={lcp ? "high" : "auto"}
        src={desktop || mobile!}
        width={1440}
        height={600}
      />
      <img
        class="object-cover w-full h-full"
        loading={lcp ? "eager" : "lazy"}
        src={imageSrc}
        alt={alt}
      />
    </Picture>
  );
}

function BannerItem(
  { item, lcp }: { item: Banner; lcp?: boolean },
) {
  const { action } = item;
  const params = { promotion_name: item.alt };

  const selectPromotionEvent = useSendEvent({
    on: "click",
    event: { name: "select_promotion", params },
  });

  return (
    <a
      {...selectPromotionEvent}
      href={action?.href ?? "#"}
      aria-label={action?.label}
      class="relative block overflow-y-hidden w-full"
    >
      <MediaItem item={item} lcp={lcp} />
    </a>
  );
}

function Carousel({ items = [], preload, interval }: Props) {
  const id = useId();

  return (
    <div
      id={id}
      class={clx(
        "grid",
        "grid-rows-[1fr_32px_1fr_64px]",
        "grid-cols-[32px_1fr_32px]",
        "sm:grid-cols-[112px_1fr_112px] sm:min-h-min",
        "w-full px-4",
      )}
    >
      <div class="col-span-full row-span-full">
        <Slider class="carousel carousel-center w-full gap-6">
          {items.map((item, index) => (
            <Slider.Item index={index} class="carousel-item w-full rounded-lg overflow-hidden">
              <BannerItem item={item} lcp={index === 0 && preload} />
            </Slider.Item>
          ))}
        </Slider>
      </div>

      <div class="hidden items-center justify-center z-10 col-start-1 row-start-2">
        <Slider.PrevButton
          class="btn btn-neutral btn-outline btn-circle no-animation btn-sm"
          disabled={false}
        >
          <Icon id="chevron-right" class="rotate-180" />
        </Slider.PrevButton>
      </div>

      <div class="hidden items-center justify-center z-10 col-start-3 row-start-2">
        <Slider.NextButton
          class="btn btn-neutral btn-outline btn-circle no-animation btn-sm"
          disabled={false}
        >
          <Icon id="chevron-right" />
        </Slider.NextButton>
      </div>

      <ul
        class={clx(
          "col-span-full row-start-4 z-10 hidden",
          "carousel justify-center gap-3",
        )}
      >
        {items.map((_, index) => (
          <li class="carousel-item">
            <Slider.Dot
              index={index}
              class={clx(
                "bg-black opacity-20 h-3 w-3 no-animation rounded-full",
                "disabled:w-8 disabled:bg-base-100 disabled:opacity-100 transition-[width]",
              )}
            >
            </Slider.Dot>
          </li>
        ))}
      </ul>

      <Slider.JS rootId={id} interval={interval && interval * 1e3} infinite />
    </div>
  );
}

export default Carousel;
