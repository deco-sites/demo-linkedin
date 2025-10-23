import { useEffect, useState } from "preact/hooks";
import { type JSX } from "preact";
import { clx } from "../../sdk/clx.ts";
import { useId } from "../../sdk/useId.ts";

interface Props extends Omit<JSX.IntrinsicElements["input"], "onChange"> {
  onChange?: (value: number) => void;
  value?: number;
  min?: number;
  max?: number;
}

function QuantitySelector({
  id = useId(),
  disabled,
  value = 0,
  min = 0,
  max = 100,
  onChange,
  ...props
}: Props) {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleChange = (delta: number) => {
    const newValue = Math.min(Math.max(currentValue + delta, min), max);
    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  const _handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = Math.min(Math.max(Number(target.value), min), max);
    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div class="join border rounded w-full">
      <button
        type="button"
        class="btn btn-square btn-sm btn-ghost no-animation"
        onClick={() => handleChange(-1)}
        disabled={disabled || currentValue <= min}
      >
        -
      </button>
      <div
        data-tip={`Quantity must be between ${min} and ${max}`}
        class={clx(
          "flex-grow join-item",
          "flex justify-center items-center",
          "has-[:invalid]:tooltip has-[:invalid]:tooltip-error has-[:invalid]:tooltip-open has-[:invalid]:tooltip-bottom",
        )}
      >
        <input
          id={id}
          class={clx(
            "input input-sm text-center flex-grow [appearance:textfield]",
            "invalid:input-error",
          )}
          disabled={disabled}
          inputMode="numeric"
          type="number"
          value={currentValue}
          min={min}
          max={max}
          {
            /* onChange={handleInputChange} */
            ...props
          }
        />
      </div>
      <button
        type="button"
        class="btn btn-square btn-sm btn-ghost no-animation"
        onClick={() => handleChange(1)}
        disabled={disabled || currentValue >= max}
      >
        +
      </button>
    </div>
  );
}

export default QuantitySelector;
