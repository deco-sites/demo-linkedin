import { ImageWidget, VideoWidget } from "apps/admin/widgets.ts";
import Image from "apps/website/components/Image.tsx";

interface Item {
  /**
   * @title Type
   * @description Choose between image or video
   */
  type: "image" | "video";
  /**
   * @title Desktop Image
   */
  image?: ImageWidget;
  /**
   * @title Mobile Image
   */
  mobileImage?: ImageWidget;
  /**
   * @title Desktop Video
   */
  video?: VideoWidget;
  /**
   * @title Mobile Video
   */
  mobileVideo?: VideoWidget;
  /**
   * @title Width
   */
  width: number;
  /**
   * @title Height
   */
  height: number;
  /**
   * @title Alt/Title
   * @description Alt text for images or title for videos
   */
  alt?: string;
}

interface Props {
  images: Item[];
}

function MediaItem({ item }: { item: Item }) {
  if (item.type === "video") {
    return (
      <div class="w-1/3">
        <video
          class="w-full h-full block sm:hidden rounded-lg object-cover"
          src={item.mobileVideo}
          title={item.alt}
          width={item.width}
          height={item.height}
          autoplay
          muted
        />
        <video
          class="w-full h-full hidden sm:block rounded-lg object-cover"
          src={item.video}
          title={item.alt}
          width={item.width}
          height={item.height}
          autoplay
          muted
        />
      </div>
    );
  }

  return (
    <div class="w-1/3">
      <Image
        class="w-full h-full block sm:hidden rounded-lg"
        src={item.mobileImage!}
        alt={item.alt}
        width={item.width}
        height={item.height}
      />
      <Image
        class="w-full h-full hidden sm:block rounded-lg"
        src={item.image!}
        alt={item.alt}
        width={item.width}
        height={item.height}
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
