// Browser shim for deco/clients/withManifest.ts
// Provides a client-side way to invoke loaders/actions via fetch

export function withManifest<T = any>() {
  return {
    invoke: async (key: string, props?: any) => {
      try {
        const response = await fetch("/deco/invoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, props }),
        });
        
        if (!response.ok) {
          throw new Error(`Invoke failed: ${response.status}`);
        }
        
        return await response.json();
      } catch (e) {
        console.error("[invoke] Failed:", key, e);
        throw e;
      }
    },
  };
}

// Also export invoke directly
export const invoke = async (key: string, props?: any) => {
  return withManifest().invoke(key, props);
};

