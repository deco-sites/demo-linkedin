import { ImageWidget } from "apps/admin/widgets.ts";
import Image from "apps/website/components/Image.tsx";
import { useScript } from "@deco/deco/hooks";
import { useId } from "../../sdk/useId.ts";

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
      <Image
        class="w-full h-full block sm:hidden rounded-lg"
        src={image.mobileImage}
        alt={image.alt}
        width={image.width}
        height={image.height}
      />
      <Image
        class="w-full h-full hidden sm:block rounded-lg"
        src={image.image}
        alt={image.alt}
        width={image.width}
        height={image.height}
      />
    </div>
  );
}

const onLoad = (containerId: string) => {
  const container = document.getElementById(containerId) as HTMLDivElement;
  if (!container) return;

  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;
  let animationFrame: number | null = null;

  // Mouse wheel horizontal scrolling with smooth animation
  const _handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY || e.deltaX;

    // Smooth scroll animation
    const targetScroll = container.scrollLeft + delta;
    const startScroll = container.scrollLeft;
    const distance = targetScroll - startScroll;
    const duration = 300;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      container.scrollLeft = startScroll + (distance * easeOutCubic);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  // Mouse drag scrolling with momentum
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    isDragging = true;
    startX = e.pageX;
    lastX = e.pageX;
    scrollLeft = container.scrollLeft;
    lastTime = performance.now();
    velocity = 0;

    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
    container.style.scrollBehavior = "auto";

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    const deltaX = e.pageX - lastX;

    if (deltaTime > 0) {
      velocity = deltaX / deltaTime;
    }

    const x = e.pageX;
    const walk = (x - startX) * 1.5; // Reduced multiplier for smoother feel
    container.scrollLeft = scrollLeft - walk;

    lastX = e.pageX;
    lastTime = currentTime;
  };

  // Add momentum scrolling when mouse is released
  const applyMomentum = () => {
    if (Math.abs(velocity) < 0.1) {
      container.style.scrollBehavior = "smooth";
      return;
    }

    const deceleration = 0.95;
    const minVelocity = 0.1;

    container.scrollLeft -= velocity * 10;
    velocity *= deceleration;

    if (Math.abs(velocity) > minVelocity) {
      animationFrame = requestAnimationFrame(applyMomentum);
    } else {
      container.style.scrollBehavior = "smooth";
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = "grab";
    container.style.userSelect = "auto";

    // Apply momentum scrolling
    applyMomentum();
  };

  const handleMouseLeave = () => {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = "grab";
    container.style.userSelect = "auto";

    // Apply momentum scrolling
    applyMomentum();
  };

  // Touch support for mobile
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    isDragging = true;
    startX = touch.pageX;
    lastX = touch.pageX;
    scrollLeft = container.scrollLeft;
    lastTime = performance.now();
    velocity = 0;

    container.style.scrollBehavior = "auto";

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    const deltaX = touch.pageX - lastX;

    if (deltaTime > 0) {
      velocity = deltaX / deltaTime;
    }

    const x = touch.pageX;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;

    lastX = touch.pageX;
    lastTime = currentTime;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    applyMomentum();
  };

  // Add event listeners
  container.addEventListener("mousedown", handleMouseDown);
  container.addEventListener("mousemove", handleMouseMove);
  container.addEventListener("mouseup", handleMouseUp);
  container.addEventListener("mouseleave", handleMouseLeave);

  // Touch events for mobile
  container.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  container.addEventListener("touchmove", handleTouchMove, { passive: false });
  container.addEventListener("touchend", handleTouchEnd);

  // Set initial cursor and smooth scrolling
  container.style.cursor = "grab";
  container.style.scrollBehavior = "smooth";
};

export default function SecondaryImageCarousel({ images }: Props) {
  const id = useId();

  return (
    <div>
      <div
        id={id}
        class="px-4 overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        <div class="inline-flex flex-nowrap gap-2 pt-2 pb-2">
          {images.map((image, index) => (
            <ImageItem
              key={index}
              image={image}
            />
          ))}
        </div>
      </div>
      <script
        type="module"
        dangerouslySetInnerHTML={{ __html: useScript(onLoad, id) }}
      />
    </div>
  );
}
