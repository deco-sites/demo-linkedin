import { IS_BROWSER } from "$fresh/runtime.ts";

// Lazy import to break circular dependency
let _cachedPlatform: string | null = null;

export const usePlatform = () => {
  if (IS_BROWSER) {
    throw new Error(
      "This function can not be used inside islands. Move this to the outter component",
    );
  }
  
  // Return cached value if available
  if (_cachedPlatform !== null) {
    return _cachedPlatform;
  }

  // Lazy load to break circular dependency
  try {
    // Dynamic require to avoid static import cycle
    const siteModule = require("../../apps/site.ts");
    _cachedPlatform = siteModule._platform || "custom";
    return _cachedPlatform;
  } catch {
    // Fallback for initial load
    return "custom";
  }
};
