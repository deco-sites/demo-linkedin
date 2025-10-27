import { useEffect } from "preact/hooks";
import { useId } from "../sdk/hooks/useId.ts";
import Image from "apps/website/components/Image.tsx";

interface CarouselImage {
  src: string;
  alt?: string;
  width: number;
  height: number;
}

interface Props {
  images: CarouselImage[];
}

export default function ImageCarousel({ images }: Props) {
  const id = useId();

  useEffect(() => {
    const container = document.getElementById(id) as HTMLDivElement;
    if (!container) return;

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let animationFrame: number | null = null;

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
      const walk = (x - startX) * 1.5;
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

      applyMomentum();
    };

    const handleMouseLeave = () => {
      if (!isDragging) return;
      isDragging = false;
      container.style.cursor = "grab";
      container.style.userSelect = "auto";

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

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);

    // Set initial cursor and smooth scrolling
    container.style.cursor = "grab";
    container.style.scrollBehavior = "smooth";

    // Cleanup
    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [id]);

  return (
    <div
      id={id}
      class="px-4 overflow-x-auto overflow-y-hidden scroll-smooth"
      style={{ scrollbarWidth: "thin" }}
    >
      <div class="inline-flex flex-nowrap gap-2 pt-2 pb-2">
        {images.map((image, index) => (
          <div
            key={index}
            style={{
              width: image.width,
              height: image.height,
            }}
          >
            <Image
              class="w-full h-full rounded-lg"
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
