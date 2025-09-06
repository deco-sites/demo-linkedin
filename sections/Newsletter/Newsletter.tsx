import { AppContext } from "../../apps/site.ts";
import Icon from "../../components/ui/Icon.tsx";
import Section from "../../components/ui/Section.tsx";
import { clx } from "../../sdk/clx.ts";

import { useComponent } from "../Component.tsx";
import { type SectionProps } from "@deco/deco";
interface NoticeProps {
  title?: string;
  description?: string;
}
export interface Props {
  empty?: NoticeProps;
  success?: NoticeProps;
  failed?: NoticeProps;
  /** @description Signup label */
  label?: string;
  /** @description Input placeholder */
  placeholder?: string;
  /** @hide true */
  status?: "success" | "failed";
}
export async function action(props: Props, req: Request, ctx: AppContext) {
  const form = await req.formData();
  const email = `${form.get("email") ?? ""}`;
  const name = `${form.get("name") ?? ""}`;

  // Check if we have a vtex context
  if (ctx && typeof ctx.invoke === "function") {
    try {
      // deno-lint-ignore no-explicit-any
      await (ctx as any).invoke("vtex/actions/newsletter/subscribe.ts", {
        email,
        name,
      });
      return { ...props, status: "success" };
    } catch {
      return { ...props, status: "failed" };
    }
  }
  return { ...props, status: "failed" };
}
export function loader(props: Props) {
  return { ...props, status: undefined };
}
function Notice({ title, description }: {
  title?: string;
  description?: string;
}) {
  return (
    <div class="flex flex-col justify-center items-center gap-4">
      <span class="text-3xl font-semibold text-center">
        {title}
      </span>
      <span class="text-sm font-normal text-gray-600 text-center">
        {description}
      </span>
    </div>
  );
}
function Newsletter({
  empty = {
    title: "Get our offers, launches and promotions",
    description: "",
  },
  success = {
    title: "Thank you for subscribing!",
    description:
      "You'll now receive the latest news, trends, and exclusive promotions directly in your inbox. Stay tuned!",
  },
  failed = {
    title: "Oops. Something went wrong!",
    description:
      "Something went wrong. Please try again. If the problem persists, please contact us.",
  },
  placeholder = "Your email",
  status,
}: SectionProps<typeof loader, typeof action>) {
  const componentUrl = useComponent(import.meta.url);
  if (status === "success" || status === "failed") {
    return (
      <div class="py-16 px-4 flex flex-col items-center justify-center max-w-2xl mx-auto gap-8">
        <Icon
          size={80}
          class={clx(status === "success" ? "text-green-500" : "text-red-500")}
          id={status === "success" ? "check-circle" : "error"}
        />
        <Notice {...status === "success" ? success : failed} />
      </div>
    );
  }
  return (
    <div class="w-full flex justify-center items-center p-64">
      <div class="background rounded-lg w-[525px] p-4 flex flex-col items-start justify-center gap-4 max-w-2xl mx-auto">
        {/* Title */}
        <h2 class="text-sm">
          {empty.title}
        </h2>

        {/* Form */}
        <form
          hx-target="closest section"
          hx-swap="outerHTML"
          hx-post={componentUrl}
          class="w-full flex flex-col gap-4"
        >
          {/* Input fields */}
          <div class="flex gap-1">
            <input
              name="name"
              class="flex-1 h-8 rounded-lg outline-none px-2 text-xs"
              type="text"
              placeholder="Your name"
            />
            <input
              name="email"
              class="flex-1 h-8 rounded-lg outline-none px-2 text-xs"
              type="email"
              placeholder={placeholder}
            />
            <button
              class="bg-base-100 h-8 w-8 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              type="submit"
            >
              <Icon
                id="chevron-right"
                size={16}
                class="[.htmx-request_&]:hidden"
              />
              <span class="[.htmx-request_&]:inline hidden loading loading-spinner" />
            </button>
          </div>

          {/* Consent checkbox */}
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
export const LoadingFallback = () => <Section.Placeholder height="412px" />;
export default Newsletter;
