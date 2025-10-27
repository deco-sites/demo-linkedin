import { ImageWidget } from "apps/admin/widgets.ts";
import { useDevice } from "@deco/deco/hooks";
import ImageCarousel from "../../islands/ImageCarousel.tsx";

interface Item {
  /**
   * @title Desktop Image
   */
  image: ImageWidget;
  /**
   * @title Desktop Width
   */
  width: number;
  /**
   * @title Desktop Height
   */
  height: number;
  /**
   * @title Mobile Image
   */
  mobileImage: ImageWidget;
  /**
   * @title Mobile Width
   */
  mobileWidth: number;
  /**
   * @title Mobile Height
   */
  mobileHeight: number;
  /**
   * @title Alt
   */
  alt?: string;
}

interface Props {
  images: Item[];
}

export default function SecondaryImageCarousel({ images }: Props) {
  const device = useDevice();
  const isMobile = device === "mobile";

  // Map images to carousel format based on device
  const carouselImages = images.map((image) => ({
    src: isMobile ? image.mobileImage : image.image,
    alt: image.alt,
    width: isMobile ? image.mobileWidth : image.width,
    height: isMobile ? image.mobileHeight : image.height,
  }));

  return (
    <div>
      <ImageCarousel images={carouselImages} />
    </div>
  );
}
