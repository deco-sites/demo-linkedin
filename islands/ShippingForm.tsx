import { useState } from "preact/hooks";
import type { SimulationOrderForm, SKU, Sla } from "apps/vtex/utils/types.ts";
import { invoke } from "../runtime.ts";
import { formatPrice } from "../sdk/format.ts";

export interface Props {
  items: SKU[];
}

const formatShippingEstimate = (estimate: string) => {
  const [, time, type] = estimate.split(/(\d+)/);

  if (type === "bd") return `${time} dias úteis`;
  if (type === "d") return `${time} dias`;
  if (type === "h") return `${time} horas`;
};

export default function ShippingForm({ items }: Props) {
  const [postalCode, setPostalCode] = useState("");
  const [result, setResult] = useState<SimulationOrderForm | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!postalCode.trim()) return;

    setIsLoading(true);
    setHasError(false);
    try {
      const simulation = await invoke.vtex.actions.cart.simulation({
        items: items,
        postalCode: postalCode.trim(),
        country: "BRA",
      }) as SimulationOrderForm | null;

      setResult(simulation);
      if (!simulation) {
        setHasError(true);
      }
    } catch (error) {
      console.error("Error calculating shipping:", error);
      setHasError(true);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const methods = result?.logisticsInfo?.reduce(
    (initial, { slas }) => [...initial, ...slas],
    [] as Sla[],
  ) ?? [];

  return (
    <div class="flex flex-col gap-2">
      <div class="flex flex-col">
        <span class="text-[#616B6B] text-sm pt-5 border-t-[1px] border-gray-300">
          Informe seu CEP para consultar os prazos de entrega.
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
          <span class={isLoading ? "hidden" : "inline"}>Calcular</span>
          <span class={isLoading ? "inline" : "hidden"}>
            <span class="loading loading-spinner loading-xs" />
          </span>
        </button>
      </form>

      {/* Results */}
      <div>
        {hasError && !methods.length && (
          <div class="p-2">
            <span>CEP inválido</span>
          </div>
        )}
        {methods.length > 0 && (
          <ul class="flex flex-col gap-4 p-4 border border-base-400 rounded">
            {methods.map((method) => (
              <li class="flex justify-between items-center border-base-200 not-first-child:border-t">
                <span class="text-button text-center">
                  Entrega {method.name}
                </span>
                <span class="text-button">
                  até {formatShippingEstimate(method.shippingEstimate)}
                </span>
                <span class="text-base font-semibold text-right">
                  {method.price === 0 ? "Grátis" : (
                    formatPrice(method.price / 100, "BRL", "pt-BR")
                  )}
                </span>
              </li>
            ))}
            <span class="text-xs font-thin">
              Os prazos de entrega começam a contar a partir da confirmação do
              pagamento e podem variar de acordo com a quantidade de produtos na
              sacola.
            </span>
          </ul>
        )}
      </div>
    </div>
  );
}
