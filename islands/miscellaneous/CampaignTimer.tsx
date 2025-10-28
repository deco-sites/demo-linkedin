import type { HTMLWidget } from "apps/admin/widgets.ts";
import { useId } from "../../sdk/hooks/useId.ts";
import { useEffect, useState } from "preact/hooks";

export interface Props {
  text?: HTMLWidget;
  expiresAt?: string;
  labels?: {
    days?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
  };
}

interface TimeState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface TimeComponentProps {
  value: number;
  label: string | undefined;
}

const TimeComponent = ({ value, label }: TimeComponentProps) => (
  <div class="flex flex-col items-center">
    <span class="countdown font-normal text-xl lg:text-2xl">
      <span
        class="md:text-8xl text-6xl font-thin text-base-content tracking-[-3px]"
        style={{ "--value": value } as preact.JSX.CSSProperties}
      />
    </span>
    <span class="md:text-2xl text-base-content font-thin">
      {label || ""}
    </span>
  </div>
);

export default function CampaignTimer({
  expiresAt = `${new Date()}`,
  labels = {
    days: "days",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
  },
  text = "",
}: Props) {
  const id = useId();
  const [timeLeft, setTimeLeft] = useState<TimeState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const expirationDate = new Date(expiresAt).getTime();

    const getDelta = () => {
      const delta = expirationDate - new Date().getTime();
      const days = Math.floor(delta / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((delta % (1000 * 60)) / 1000);
      return {
        days,
        hours,
        minutes,
        seconds,
      };
    };

    const updateTimer = () => {
      const delta = getDelta();
      const expired =
        delta.days + delta.hours + delta.minutes + delta.seconds < 0;

      if (expired) {
        setIsExpired(true);
      } else {
        setTimeLeft(delta);
      }
    };

    // Initial update
    updateTimer();

    // Start interval
    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [expiresAt]);

  return (
    <div>
      <div class="container mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-16 py-16 sm:px-10 gap-4">
        {isExpired
          ? (
            <div
              id={`${id}::expired`}
              class="text-sm text-center lg:text-xl lg:text-left lg:max-w-lg"
              dangerouslySetInnerHTML={{ __html: text || "Expired!" }}
            />
          )
          : (
            <div class="flex flex-wrap gap-8 lg:gap-16 items-center justify-center lg:justify-normal">
              <div id={`${id}::counter`}>
                <div class="grid grid-flow-col md:gap-20 sm:gap-10 gap-5 text-center auto-cols-max items-center">
                  <TimeComponent value={timeLeft.days} label={labels?.days} />
                  <TimeComponent value={timeLeft.hours} label={labels?.hours} />
                  <TimeComponent
                    value={timeLeft.minutes}
                    label={labels?.minutes}
                  />
                  <TimeComponent
                    value={timeLeft.seconds}
                    label={labels?.seconds}
                  />
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
