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
export interface ImageBanner {
  /** @description desktop optimized image */
  desktop: ImageWidget;

  /** @description mobile optimized image */
  mobile: ImageWidget;

  /** @description Image's alt text or description */
  alt: string;
  action?: Action;
}

/**
 * @titleBy alt
 */
export interface VideoBanner {
  /** @description video source */
  video: VideoWidget;

  /** @description Video's alt text or description */
  alt: string;

  /** @description Video poster image (thumbnail) */
  poster?: ImageWidget;

  /** @description Auto-play video (default: false) */
  autoplay?: boolean;

  /** @description Mute video (default: true) */
  muted?: boolean;

  /** @description Loop video (default: true) */
  loop?: boolean;

  action?: Action;
}

interface Action {
  /** @description when user clicks on the media, go to this link */
  href?: string;
  /** @description Media text title */
  title?: string;
  /** @description Media text subtitle */
  subTitle?: string;
  /** @description Button label */
  label?: string;
}

/**
 * @titleBy alt
 */
export type Banner = ImageBanner | VideoBanner;

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
  const { alt } = item;

  const viewPromotionEvent = useSendEvent({
    on: "view",
    event: { name: "view_promotion", params: { promotion_name: alt } },
  });

  // Check if it's a video by looking for video field
  if ("video" in item) {
    const videoItem = item as VideoBanner;
    const { video, poster, autoplay = false, muted = true, loop = true } =
      videoItem;

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

  // It's an image - check for desktop and mobile fields
  const imageItem = item as ImageBanner;
  const { desktop, mobile } = imageItem;

  return (
    <Picture preload={lcp} {...viewPromotionEvent}>
      <Source
        media="(max-width: 767px)"
        fetchPriority={lcp ? "high" : "auto"}
        src={mobile}
        width={412}
        height={660}
      />
      <Source
        media="(min-width: 768px)"
        fetchPriority={lcp ? "high" : "auto"}
        src={desktop}
        width={1440}
        height={600}
      />
      <img
        class="object-cover w-full h-full"
        loading={lcp ? "eager" : "lazy"}
        src={desktop}
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
            <Slider.Item
              index={index}
              class="carousel-item w-full rounded-lg overflow-hidden"
            >
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

const defaultProps: Props = {
  items: [
    {
      desktop:
        "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/1818/ff6bb37e-0eab-40e1-a454-86856efc278e",
      mobile:
        "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/1818/ff6bb37e-0eab-40e1-a454-86856efc278e",
      alt: "Banner promocional",
      action: {
        href: "#",
        title: "Título do Banner",
        subTitle: "Subtítulo do Banner",
        label: "Ver mais",
      },
    },
    {
      video:
        "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/1818/ff6bb37e-0eab-40e1-a454-86856efc278e",
      alt: "Vídeo promocional",
      poster:
        "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/1818/ff6bb37e-0eab-40e1-a454-86856efc278e",
      autoplay: true,
      muted: true,
      loop: true,
      action: {
        href: "#",
        title: "Título do Vídeo",
        subTitle: "Subtítulo do Vídeo",
        label: "Assistir",
      },
    },
  ],
  preload: true,
  interval: 5,
};

export function Preview() {
  return <Carousel {...defaultProps} />;
}

export default Carousel;
