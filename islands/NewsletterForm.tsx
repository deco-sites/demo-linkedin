import { useState } from "preact/hooks";
import Icon from "../components/ui/Icon.tsx";
import { invoke } from "../runtime.ts";

interface Props {
  title?: string;
  namePlaceholder?: string;
  emailPlaceholder?: string;
}

export default function NewsletterForm({
  title = "Get our offers, launches and promotions",
  namePlaceholder = "Your name",
  emailPlaceholder = "Your email",
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) return;

    setIsLoading(true);
    try {
      await invoke.vtex.actions.newsletter.subscribe({
        email: email.trim(),
        name: name.trim(),
      });
      setStatus("success");
      setName("");
      setEmail("");
    } catch (error) {
      console.error("Failed to subscribe to newsletter:", error);
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  if (status !== "idle") {
    const isSuccess = status === "success";
    return (
      <div class="text-center space-y-2 py-16 px-4 flex flex-col items-center justify-center max-w-2xl mx-auto gap-8">
        <Icon
          size={48}
          class={isSuccess ? "text-green-500 mx-auto" : "text-red-500 mx-auto"}
          id={isSuccess ? "check-circle" : "error"}
        />
        <p class="text-sm font-medium">
          {isSuccess
            ? "Obrigado por se inscrever! Você receberá novidades em breve."
            : "Algo deu errado. Tente novamente."}
        </p>
        {!isSuccess && (
          <button
            type="button"
            class="btn btn-sm btn-outline"
            onClick={() => setStatus("idle")}
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div class="w-full flex justify-center items-center p-4 md:p-64">
      <div class="background rounded-lg w-full md:w-[525px] p-4 flex flex-col items-start justify-center gap-4 max-w-2xl mx-auto">
        <form class="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <h2 class="text-sm">{title}</h2>
          <div class="flex gap-1">
            <input
              name="name"
              class="flex-1 h-8 rounded-lg outline-none px-2 text-xs"
              type="text"
              placeholder={namePlaceholder}
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              required
            />
            <input
              name="email"
              class="flex-1 h-8 rounded-lg outline-none px-2 text-xs"
              type="email"
              placeholder={emailPlaceholder}
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              required
            />
            <button
              class="bg-base-100 h-8 w-8 rounded-lg transition-colors duration-200 flex items-center justify-center"
              type="submit"
              disabled={isLoading || !name.trim() || !email.trim()}
            >
              {isLoading
                ? <span class="loading loading-spinner" />
                : <Icon id="chevron-right" size={16} />}
            </button>
          </div>
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              id="consent"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              required
            />
            <label
              for="consent"
              class="text-[10px] text-gray-600 leading-relaxed truncate text-nowrap"
            >
              I agree to receive information about products and special
              promotional offers.
            </label>
          </div>
        </form>
      </div>
    </div>
  );
}
