import { useState } from "preact/hooks";
import type { SKU } from "apps/vtex/utils/types.ts";
import { useId } from "site/sdk/hooks/useId.ts";

export interface Props {
  items: SKU[];
}

export default function ShippingForm({ items }: Props) {
  const slot = useId();
  const [postalCode, setPostalCode] = useState("");
  // deno-lint-ignore no-explicit-any
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!postalCode.trim()) return;

    setIsLoading(true);
    try {
      // Call the shipping results action
      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode: postalCode.trim(),
          items: items.map((item) => ({ skuId: item.id })),
        }),
      });

      if (response.ok) {
        const shippingResults = await response.json();
        setResults(shippingResults);
      } else {
        console.error("Failed to calculate shipping");
      }
    } catch (error) {
      console.error("Error calculating shipping:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex flex-col">
        <span class="text-[#616B6B] text-sm pt-5 border-t-[1px] border-gray-300">
          Please provide your ZIP code to check the delivery times.
        </span>
      </div>

      <form class="relative join" onSubmit={handleSubmit}>
        <input
          type="text"
          class="input input-bordered join-item w-48"
          placeholder="00000000"
          name="postalCode"
          maxLength={8}
          size={8}
          value={postalCode}
          onInput={(e) => setPostalCode((e.target as HTMLInputElement).value)}
        />
        <button
          type="submit"
          class="btn join-item no-animation"
          disabled={isLoading || !postalCode.trim()}
        >
          <span class={isLoading ? "hidden" : "inline"}>Calculate</span>
          <span class={isLoading ? "inline" : "hidden"}>
            <span class="loading loading-spinner loading-xs" />
          </span>
        </button>
      </form>

      {/* Results Slot */}
      <div id={slot}>
        {results && (
          <div class="mt-4 p-4 bg-base-200 rounded-lg">
            <h3 class="font-semibold mb-2">Shipping Options</h3>
            {results.options?.map((option, index: number) => (
              <div
                key={index}
                class="flex justify-between items-center py-2 border-b border-base-300 last:border-b-0"
              >
                <span class="text-sm">{option.name}</span>
                <span class="text-sm font-medium">{option.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
