/**
 * Bun Preload Script
 * 
 * This script runs before the main server and sets up module aliasing
 * for Fresh/Deno compatibility.
 * 
 * Features:
 * - Fresh/Deno import shimming
 * - Island wrapping for hydration (Fresh 2 style)
 * 
 * All compat modules now live in @deco/deco/compat - no site-level compat needed!
 */
import { plugin, type BunPlugin, type PluginBuilder } from "bun";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Find the deco package - either via node_modules symlink or relative path
const decoPath = resolve(__dirname, "node_modules/@deco/deco");

// Island hydration wrapper - injected into island modules
const ISLAND_WRAPPER_PREAMBLE = `
import { h } from "preact";

let __islandCounter = 0;

function __wrapIsland(Component, islandPath) {
  return function IslandWrapper(props) {
    const id = "island-" + (__islandCounter++);
    
    // Filter serializable props
    const serializableProps = {};
    for (const [key, value] of Object.entries(props)) {
      if (typeof value !== "function" && key !== "children") {
        try {
          JSON.stringify(value);
          serializableProps[key] = value;
        } catch (e) {}
      }
    }
    
    return h("div", {
      "data-island": islandPath,
      "data-island-id": id,
      "data-island-props": JSON.stringify(serializableProps),
      style: { display: "contents" }
    }, h(Component, props));
  };
}
`;

// Plugin to redirect Fresh and Deno imports to compat modules
plugin({
  name: "deco-compat",
  setup(build: PluginBuilder) {
    // Fresh runtime → @deco/deco/compat/fresh.ts
    build.onResolve({ filter: /^\$fresh\/runtime\.ts$/ }, () => ({
      path: resolve(decoPath, "compat/fresh.ts"),
    }));
    
    // Deco hooks → @deco/deco/compat/device.ts (for useDevice)
    build.onResolve({ filter: /^@deco\/deco\/hooks$/ }, () => ({
      path: resolve(decoPath, "compat/device.ts"),
    }));
    
    // Deco manifest client → @deco/deco/compat/invoke.ts
    build.onResolve({ filter: /^deco\/clients\/withManifest\.ts$/ }, () => ({
      path: resolve(decoPath, "compat/invoke.ts"),
    }));
    
    // Deno std library shims → @deco/deco/compat/std-*.ts
    build.onResolve({ filter: /^@std\/path/ }, () => ({
      path: resolve(decoPath, "compat/std-path.ts"),
    }));
    
    build.onResolve({ filter: /^@std\/flags/ }, () => ({
      path: resolve(decoPath, "compat/std-flags.ts"),
    }));
    
    build.onResolve({ filter: /^@std\/fmt\/colors/ }, () => ({
      path: resolve(decoPath, "compat/std-fmt-colors.ts"),
    }));
    
    // Legacy std/path format
    build.onResolve({ filter: /^std\/path\/mod\.ts$/ }, () => ({
      path: resolve(decoPath, "compat/std-path.ts"),
    }));
    
    // site/* alias → current directory
    build.onResolve({ filter: /^site\// }, (args: { path: string }) => {
      const relativePath = args.path.replace(/^site\//, "");
      return {
        path: resolve(__dirname, relativePath),
      };
    });
    
    // npm: protocol (Deno-style) → strip prefix
    build.onResolve({ filter: /^npm:/ }, (args: { path: string }) => {
      // Strip npm: prefix and version specifier
      const npmPackage = args.path.replace(/^npm:/, "").replace(/@[\d.]+$/, "");
      return {
        path: npmPackage,
        external: true,
      };
    });
    
    // Handle preact jsx runtime
    build.onResolve({ filter: /^preact\/jsx-dev-runtime$/ }, () => ({
      path: "preact/jsx-runtime",
      external: true,
    }));
    
    // Transform island files to wrap their default export
    build.onLoad({ filter: /\/islands\/.*\.(tsx?|jsx?)$/ }, (args: { path: string }) => {
      const islandsDir = resolve(__dirname, "islands");
      if (!args.path.startsWith(islandsDir)) {
        return undefined; // Not our islands
      }
      
      const relativePath = args.path.slice(islandsDir.length + 1);
      const islandPath = `islands/${relativePath.replace(/\.(tsx?|jsx?)$/, "")}`;
      
      let code = readFileSync(args.path, "utf-8");
      
      // Find and wrap the default export
      // Handle: export default function Name(...) { ... }
      // Handle: export default Name;
      
      const defaultFunctionMatch = code.match(/export\s+default\s+function\s+(\w+)/);
      const defaultNameMatch = code.match(/export\s+default\s+(\w+)\s*;/);
      
      if (defaultFunctionMatch) {
        const funcName = defaultFunctionMatch[1];
        // Rename the function and wrap it
        code = code.replace(
          /export\s+default\s+function\s+(\w+)/,
          `function __Original$1`
        );
        code = ISLAND_WRAPPER_PREAMBLE + code;
        code += `\nconst ${funcName} = __wrapIsland(__Original${funcName}, "${islandPath}");\nexport default ${funcName};\n`;
      } else if (defaultNameMatch) {
        const varName = defaultNameMatch[1];
        // The variable is already defined, just wrap it
        code = code.replace(
          /export\s+default\s+(\w+)\s*;/,
          ""
        );
        code = ISLAND_WRAPPER_PREAMBLE + code;
        code += `\nexport default __wrapIsland(${varName}, "${islandPath}");\n`;
      }
      
      return {
        contents: code,
        loader: args.path.endsWith(".tsx") ? "tsx" : "ts",
      };
    });
  },
});

console.log("✓ Deco compat plugin loaded (using @deco/deco/compat)");
console.log("  - Island wrapping enabled for /islands/");

