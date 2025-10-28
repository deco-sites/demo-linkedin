import { HTMLWidget } from "apps/admin/widgets.ts";
import { clx } from "../../sdk/clx.ts";
import { useId } from "../../sdk/hooks/useId.ts";
import { useEffect, useState } from "preact/hooks";

interface Props {
  title?: string;
  text?: HTMLWidget;
  policy?: {
    text?: string;
    link?: string;
  };
  buttons?: {
    allowText: string;
    cancelText?: string;
  };
  layout?: {
    position?: "Expanded" | "Left" | "Center" | "Right";
    content?: "Tiled" | "Piled up";
  };
}

export default function CookieConsent({
  title = "Cookies",
  text =
    "Guardamos estatísticas de visitas para melhorar sua experiência de navegação.",
  policy = {
    text: "Saiba mais sobre sobre política de privacidade",
    link: "/politica-de-privacidade",
  },
  buttons = {
    allowText: "Aceitar",
    cancelText: "Fechar",
  },
}: Props) {
  const id = useId();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const KEY = "store-cookie-consent";
    const ACCEPTED = "accepted";
    const consent = localStorage.getItem(KEY);

    if (consent !== ACCEPTED) {
      const handleScroll = () => {
        setIsVisible(true);
      };

      addEventListener("scroll", handleScroll, { once: true });

      return () => {
        removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  const handleAccept = () => {
    const KEY = "store-cookie-consent";
    const ACCEPTED = "accepted";
    localStorage.setItem(KEY, ACCEPTED);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div
      id={id}
      class={clx(
        "transform-gpu transition fixed bottom-0 w-screen z-50 sm:flex",
        "sm:bottom-2 sm:justify-center",
        isVisible ? "translate-y-0" : "translate-y-[200%]",
      )}
    >
      <div
        class={clx(
          "p-4 mx-4 my-2 flex flex-col gap-4 shadow bg-base-100 rounded border border-base-200",
          "sm:flex-row sm:items-end",
        )}
      >
        <div class={clx("flex-auto flex flex-col gap-4", "sm:gap-2")}>
          <h3 class="text-xl">{title}</h3>
          {text && (
            <div
              class="text-base"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          )}

          <a href={policy.link} class="text-sm link link-secondary">
            {policy.text}
          </a>
        </div>

        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="btn"
            onClick={handleAccept}
          >
            {buttons.allowText}
          </button>
          <button
            type="button"
            class="btn btn-outline"
            onClick={handleClose}
          >
            {buttons.cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
