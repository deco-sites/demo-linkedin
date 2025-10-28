import { useState } from "preact/hooks";
import type { SimulationOrderForm, SKU, Sla } from "apps/vtex/utils/types.ts";
import { invoke } from "../../runtime.ts";
import { formatPrice } from "../../sdk/format.ts";

export interface Props {
  items: SKU[];
}

const formatShippingEstimate = (estimate: string) => {
  const [, time, type] = estimate.split(/(\d+)/);

  if (type === "bd") return `${time} dias úteis`;
  if (type === "d") return `${time} dias`;
  if (type === "h") return `${time} horas`;
};

const applyCepMask = (value: string) => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 5) {
    return numbers;
  }

  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
};

const removeCepMask = (value: string) => {
  return value.replace(/\D/g, "");
};

export default function ShippingForm({ items }: Props) {
  const [postalCode, setPostalCode] = useState("");
  const [result, setResult] = useState<SimulationOrderForm | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleInputChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const masked = applyCepMask(input.value);
    setPostalCode(masked);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const cleanCep = removeCepMask(postalCode);
    if (!cleanCep || cleanCep.length !== 8) return;

    setIsLoading(true);
    setHasError(false);
    try {
      // There is support for other platforms, but the types returned for each one is different. So, we are using VTEX as the default.
      const simulation = await invoke.vtex.actions.cart.simulation({
        items: items,
        postalCode: cleanCep,
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
    <div class="flex flex-col gap-4 w-full">
      {/* Header */}
      <div class="pt-6 border-t border-gray-200">
        <h3 class="text-base font-semibold text-gray-900 mb-1">
          Calcular Frete
        </h3>
        <p class="text-sm text-gray-600">
          Informe seu CEP para consultar os prazos de entrega
        </p>
      </div>

      {/* Form */}
      <form class="flex gap-2" onSubmit={handleSubmit}>
        <div class="relative flex-1 max-w-[200px]">
          <input
            type="text"
            class="input input-bordered input-sm w-full focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
            placeholder="00000-000"
            name="postalCode"
            maxLength={9}
            value={postalCode}
            onInput={handleInputChange}
          />
        </div>
        <button
          type="submit"
          class="btn btn-primary btn-sm px-6 min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          disabled={isLoading || removeCepMask(postalCode).length !== 8}
        >
          {isLoading ? <span class="loading loading-spinner loading-sm" /> : (
            "Calcular"
          )}
        </button>
      </form>

      {/* Results */}
      <div class="min-h-[40px] max-w-[350px]">
        {hasError && !methods.length && (
          <div class="bg-error/10 border border-error/20 rounded-lg p-4 animate-in fade-in duration-200">
            <div class="flex items-center gap-2">
              <svg
                class="w-5 h-5 text-error flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="text-xs text-error font-medium">
                CEP não encontrado. Verifique e tente novamente.
              </span>
            </div>
          </div>
        )}

        {methods.length > 0 && (
          <div class="bg-base-100 border border-gray-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">
              Opções de Entrega
            </h4>
            <ul class="flex flex-col gap-3">
              {methods.map((method, index) => (
                <li
                  class={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-3 ${
                    index < methods.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div class="flex flex-col gap-1">
                    <span class="text-sm font-medium text-gray-900">
                      {method.name}
                    </span>
                    <span class="text-xs text-gray-600">
                      até {formatShippingEstimate(method.shippingEstimate)}
                    </span>
                  </div>
                  <span class="text-base font-bold text-primary">
                    {method.price === 0
                      ? <span class="text-success">Grátis</span>
                      : (
                        formatPrice(method.price / 100, "BRL", "pt-BR")
                      )}
                  </span>
                </li>
              ))}
            </ul>
            <div class="mt-4 pt-3 border-t border-gray-100">
              <p class="text-xs text-gray-500 leading-relaxed">
                Os prazos de entrega começam a contar a partir da confirmação do
                pagamento e podem variar de acordo com a quantidade de produtos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
