import { ImageWidget } from "apps/admin/widgets.ts";
import Image from "apps/website/components/Image.tsx";

interface Item {
    /**
     * @title Desktop Image
     */
    image: ImageWidget;
    /**
     * @title Mobile Image
     */
    mobileImage: ImageWidget;
    /**
     * @title Width
     */
    width: number;
    /**
     * @title Height
     */
    height: number;
    /**
     * @title Alt
     */
    alt?: string;
}

interface Props {
    images: Item[];
}

function ImageItem({ image }: { image: Item }) { 
    return (
        <div style={{ width: image.width, height: image.height }}>
            <Image class="w-full h-full block sm:hidden rounded-lg" src={image.mobileImage} alt={image.alt} width={image.width} height={image.height} />
            <Image class="w-full h-full hidden sm:block rounded-lg" src={image.image} alt={image.alt} width={image.width} height={image.height} />
        </div>
    )
}


export default function ImageCarousel({ images }: Props) {
    return (
        <div class="px-4 overflow-x-auto overflow-y-hidden">
            <div class="inline-flex flex-nowrap gap-2 pt-2 pb-2">
                {images.map((image) => (
                        <ImageItem image={image} />
                    ))}
            </div>
        </div>
    )
}