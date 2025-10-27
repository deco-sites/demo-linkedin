import Section from "../../components/ui/Section.tsx";
import NewsletterForm from "../../islands/newsletter/NewsletterForm.tsx";

export interface Props {
  /** @title Newsletter title */
  title?: string;
  /** @description Name input placeholder */
  namePlaceholder?: string;
  /** @description Email input placeholder */
  emailPlaceholder?: string;
}

export default function Newsletter({
  title = "Get our offers, launches and promotions",
  namePlaceholder = "Your name",
  emailPlaceholder = "Your email",
}: Props) {
  return (
    <NewsletterForm
      title={title}
      namePlaceholder={namePlaceholder}
      emailPlaceholder={emailPlaceholder}
    />
  );
}

export const LoadingFallback = () => <Section.Placeholder height="412px" />;
