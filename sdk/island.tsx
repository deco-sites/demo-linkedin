/**
 * Island wrapper utility for SSR hydration markers
 * 
 * Based on Fresh 2 approach: https://deno.com/blog/an-update-on-fresh
 * Islands are wrapped with data attributes that the hydration script uses
 * to find and hydrate them on the client.
 */
import { h, ComponentType, VNode } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

let islandCounter = 0;

/**
 * Higher-order component that wraps an island for hydration
 * On the server, adds data-island attributes for client hydration
 * On the client, just renders the component directly
 */
export function createIsland<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  islandPath: string
): ComponentType<P> {
  return function IslandWrapper(props: P) {
    // On the client, just render the component
    if (IS_BROWSER) {
      return h(Component, props);
    }
    
    // On the server, wrap with hydration markers
    const id = `island-${islandCounter++}`;
    
    // Filter serializable props for hydration (exclude functions and children)
    const serializableProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (typeof value !== "function" && key !== "children") {
        try {
          JSON.stringify(value);
          serializableProps[key] = value;
        } catch {
          // Skip non-serializable
        }
      }
    }
    
    return h(
      "div",
      {
        "data-island": islandPath,
        "data-island-id": id,
        "data-island-props": JSON.stringify(serializableProps),
        style: { display: "contents" },
      },
      h(Component, props)
    );
  };
}

/**
 * Decorator to mark a component as an island
 * Usage:
 *   const MyIsland = island("islands/my/Component", MyComponent);
 */
export const island = createIsland;

