import { HTMLWidget } from "apps/admin/widgets.ts";
import CookieConsentIsland from "../../islands/miscellaneous/CookieConsent.tsx";

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

export default function CookieConsent(props: Props) {
  return <CookieConsentIsland {...props} />;
}

export const LoadingFallback = () => null;
