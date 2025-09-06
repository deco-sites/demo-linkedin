import type { ImageWidget, VideoWidget } from "apps/admin/widgets.ts";
import Image from "apps/website/components/Image.tsx";

/**
 * @titleBy alt
 */
export interface ImageItem {
  /** @description desktop optimized image */
  desktop: ImageWidget;

  /** @description mobile optimized image */
  mobile: ImageWidget;

  /** @description Image's alt text or description */
  alt: string;

  /** @title Width */
  width: number;

  /** @title Height */
  height: number;

  action?: Action;
}

/**
 * @titleBy alt
 */
export interface VideoItem {
  /** @description video source */
  src: VideoWidget;

  /** @description Video's alt text or description */
  alt: string;

  /** @title Width */
  width: number;

  /** @title Height */
  height: number;

  /** @description Video poster image (thumbnail) */
  poster?: ImageWidget;

  /** @description Auto-play video (default: true) */
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
export type Item = ImageItem | VideoItem;

interface Props {
  images: Item[];
}

function MediaItem({ item }: { item: Item }) {
  const { alt, width, height } = item;

  // Check if it's a video by looking for src field
  if ("src" in item) {
    const videoItem = item as VideoItem;
    const { src, poster, autoplay = true, muted = true, loop = true } =
      videoItem;

    return (
      <div class="w-1/3">
        <video
          class="w-full h-full block sm:hidden rounded-lg object-cover"
          src={src}
          title={alt}
          width={width}
          height={height}
          autoplay={autoplay}
          muted={muted}
          loop={loop}
          poster={poster}
          playsInline
        />
        <video
          class="w-full h-full hidden sm:block rounded-lg object-cover"
          src={src}
          title={alt}
          width={width}
          height={height}
          autoplay={autoplay}
          muted={muted}
          loop={loop}
          poster={poster}
          playsInline
        />
      </div>
    );
  }

  // It's an image - check for desktop and mobile fields
  const imageItem = item as ImageItem;
  const { desktop, mobile } = imageItem;

  return (
    <div class="w-1/3">
      <Image
        class="w-full h-full block sm:hidden rounded-lg"
        src={mobile}
        alt={alt}
        width={width}
        height={height}
      />
      <Image
        class="w-full h-full hidden sm:block rounded-lg"
        src={desktop}
        alt={alt}
        width={width}
        height={height}
      />
    </div>
  );
}

export default function ImageGrid({ images }: Props) {
  return (
    <div class="px-4 py-2">
      <div class="flex flex-nowrap gap-4">
        {images.map((item, index) => <MediaItem key={index} item={item} />)}
      </div>
    </div>
  );
}

const defaultProps: Props = {
  images: [
    {
      desktop:
        "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/1818/ff6bb37e-0eab-40e1-a454-86856efc278e",
      mobile:
        "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/1818/ff6bb37e-0eab-40e1-a454-86856efc278e",
      alt: "Imagem promocional",
      width: 300,
      height: 200,
      action: {
        href: "#",
        title: "Título da Imagem",
        subTitle: "Subtítulo da Imagem",
        label: "Ver mais",
      },
    },
    {
      src:
        "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/1818/ff6bb37e-0eab-40e1-a454-86856efc278e",
      alt: "Vídeo promocional",
      width: 300,
      height: 200,
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
    {
      desktop:
        "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/1818/ff6bb37e-0eab-40e1-a454-86856efc278e",
      mobile:
        "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/1818/ff6bb37e-0eab-40e1-a454-86856efc278e",
      alt: "Outra imagem",
      width: 300,
      height: 200,
    },
  ],
};

export function Preview() {
  return <ImageGrid {...defaultProps} />;
}
