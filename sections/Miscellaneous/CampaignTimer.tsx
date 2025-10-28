import type { HTMLWidget } from "apps/admin/widgets.ts";
import Section from "../../components/ui/Section.tsx";
import CampaignTimerIsland from "../../islands/miscellaneous/CampaignTimer.tsx";

export interface Props {
  /**
   * @title Text
   * @default Time left for a campaign to end with a link
   */
  text?: HTMLWidget;
  /**
   * @title Expires at date
   * @format datetime
   */
  expiresAt?: string;
  labels?: {
    days?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
  };
}

export default function CampaignTimer(props: Props) {
  return <CampaignTimerIsland {...props} />;
}

export const LoadingFallback = () => <Section.Placeholder height="635px" />;
