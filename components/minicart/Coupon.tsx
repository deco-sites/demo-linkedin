import { useState } from "preact/hooks";

export interface Props {
  coupon?: string;
  onCouponChange?: (coupon: string) => void;
}

function Coupon({ coupon, onCouponChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [couponValue, setCouponValue] = useState(coupon ?? "");

  const handleSubmit = () => {
    if (onCouponChange) {
      onCouponChange(couponValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCouponValue(coupon ?? "");
    setIsEditing(false);
  };

  return (
    <div class="flex justify-between items-center px-4">
      <span class="text-sm">Discount coupon</span>

      {!isEditing ? (
        <button
          type="button"
          class="btn btn-ghost underline font-normal no-animation"
          onClick={() => setIsEditing(true)}
        >
          {coupon || "Add"}
        </button>
      ) : (
        <div class="join">
          <input
            class="input join-item"
            type="text"
            value={couponValue}
            onChange={(e) => setCouponValue((e.target as HTMLInputElement).value)}
            placeholder="Cupom"
          />
          <button
            type="button"
            class="btn join-item"
            onClick={handleSubmit}
          >
            Ok
          </button>
          <button
            type="button"
            class="btn join-item btn-outline"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default Coupon;