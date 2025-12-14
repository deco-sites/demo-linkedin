// Browser shim for $fresh/runtime.ts
// In the browser, IS_BROWSER is always true

export const IS_BROWSER = true;

// Re-export signal for client-side reactivity
export { signal, computed, effect, batch } from "@preact/signals";

