import { useEffect, useState } from "preact/hooks";
import { Suggestion } from "apps/commerce/types.ts";
import { SEARCHBAR_INPUT_FORM_ID, SEARCHBAR_POPUP_ID } from "../constants.ts";
import Icon from "../components/ui/Icon.tsx";
import { Resolved } from "@deco/deco";
import { invoke } from "../runtime.ts";
import { clx } from "../sdk/clx.ts";
import ProductCard from "../components/product/ProductCard.tsx";

// When user clicks on the search button, navigate it to
export const ACTION = "/s";
// Querystring param used when navigating the user
export const NAME = "q";

export interface SearchbarProps {
  /**
   * @title Placeholder
   * @description Search bar default placeholder message
   * @default What are you looking for?
   */
  placeholder?: string;
  /** @description Loader to run when suggesting new elements */
  loader?: Resolved<Suggestion | null>;
  /** @hidden true */
  platform?: string;
}

export default function Searchbar(
  { placeholder = "What are you looking for?", loader, platform }:
    SearchbarProps,
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Setup keyboard shortcuts and form submit handler
  useEffect(() => {
    const form = document.getElementById(
      SEARCHBAR_INPUT_FORM_ID,
    ) as HTMLFormElement | null;
    const input = form?.elements.namedItem(NAME) as HTMLInputElement | null;

    const handleSubmit = () => {
      const search_term = input?.value;
      if (search_term && typeof window !== "undefined" && window.DECO?.events) {
        window.DECO.events.dispatch({
          name: "search",
          params: { search_term },
        });
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      const isK = e.key === "k" || e.key === "K" || e.keyCode === 75;
      // Open Searchbar on meta+k
      if (e.metaKey === true && isK) {
        const popupInput = document.getElementById(
          SEARCHBAR_POPUP_ID,
        ) as HTMLInputElement | null;
        if (popupInput) {
          popupInput.checked = true;
          form?.focus();
        }
      }
    };

    form?.addEventListener("submit", handleSubmit);
    globalThis.addEventListener("keydown", handleKeydown);

    return () => {
      form?.removeEventListener("submit", handleSubmit);
      globalThis.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        if (!loader) {
          return;
        }
        const { __resolveType, ...loaderProps } = loader;

        const result = await invoke({
          // @ts-expect-error This is a dynamic resolved loader
          key: __resolveType,
          props: {
            ...loaderProps,
            // @ts-expect-error This is a dynamic resolved loader
            query: searchTerm,
          },
        }) as Suggestion | null;
        if (result) {
          setSuggestions(result);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const { products = [], searches = [] } = suggestions ?? {};
  const hasProducts = Boolean(products?.length);
  const hasTerms = Boolean(searches?.length);

  return (
    <div
      class="w-full grid gap-8 px-4 py-6 sm:background sm:rounded-lg"
      style={{ gridTemplateRows: "min-content auto" }}
    >
      <form id={SEARCHBAR_INPUT_FORM_ID} action={ACTION} class="join">
        <input
          autoFocus
          tabIndex={0}
          class="input flex-grow rounded-lg"
          name={NAME}
          placeholder={placeholder}
          autocomplete="off"
          value={searchTerm}
          onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
        />
        <label
          type="button"
          class="join-item btn btn-ghost btn-square hidden sm:inline-flex no-animation"
          for={SEARCHBAR_POPUP_ID}
          aria-label="Toggle searchbar"
        >
          <Icon id="close" />
        </label>
      </form>

      {/* Suggestions */}
      <div
        class={clx(`overflow-y-scroll`, !hasProducts && !hasTerms && "hidden")}
      >
        {isLoading && (
          <div class="flex justify-center items-center py-4">
            <span class="loading loading-spinner" />
          </div>
        )}
        {!isLoading && (hasProducts || hasTerms) && (
          <div class="gap-4 grid grid-cols-1 sm:grid-rows-1 sm:grid-cols-[150px_1fr]">
            {/* Search terms */}
            <div class="flex flex-col gap-6 text-base-100">
              <span class="font-medium text-xl" role="heading" aria-level={3}>
                Sugestões
              </span>
              <ul class="flex flex-col gap-6">
                {searches.map(({ term }) => (
                  <li>
                    <a
                      href={`${ACTION}?${NAME}=${term}`}
                      class="flex gap-4 items-center"
                    >
                      <span>
                        <Icon id="search" />
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: term }} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Products */}
            <div class="flex flex-col pt-6 md:pt-0 gap-6 overflow-x-hidden">
              <span
                class="font-medium text-xl text-base-100"
                role="heading"
                aria-level={3}
              >
                Produtos sugeridos
              </span>
              <div class="carousel gap-2">
                {products?.map((product, index) => (
                  <div class="carousel-item first:ml-4 last:mr-4 min-w-[200px] max-w-[200px]">
                    <ProductCard
                      product={product}
                      index={index}
                      itemListName="Suggestions"
                      platform={platform}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
