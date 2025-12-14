/** @jsxRuntime automatic */
/** @jsxImportSource preact */
/**
 * Deco Site Server - Running on Bun with Vite + Preact Islands
 * 
 * This server provides:
 * - SSR for sections with Preact
 * - Island hydration for interactive components
 * - Admin API compatibility (/deco/meta, /deco/invoke, etc.)
 * - Hot reload in development
 */
import { Hono } from "hono";
import { h, Fragment, ComponentType, VNode } from "preact";
import { renderToString } from "preact-render-to-string";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
// Device detection from @deco/deco/compat (no site-level compat needed!)
import { setDevice, detectDeviceFromUA } from "@deco/deco/compat/device.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const app = new Hono();
const port = parseInt(process.env.PORT || "3333");
const isDev = process.env.NODE_ENV !== "production";

// Site name inferred from folder
const siteName = basename(__dirname);

// =============================================================================
// Island Registry - Maps island paths to their bundled code for client
// =============================================================================
const islandBundles = new Map<string, string>(); // Bundled JS for browser

// Scan and bundle all islands for client-side hydration
async function registerIslands() {
  const islandsDir = join(__dirname, "islands");
  const islandFiles: { name: string; path: string }[] = [];
  
  function scanDir(dir: string, prefix = "") {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath, `${prefix}${entry}/`);
        } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
          const islandName = `${prefix}${entry.replace(/\.(tsx?|jsx?)$/, "")}`;
          islandFiles.push({ name: islandName, path: fullPath });
        }
      }
    } catch (e) {
      // Directory doesn't exist
    }
  }
  
  console.log("\n📦 Bundling islands for client-side hydration...");
  scanDir(islandsDir);
  
  // Bundle each island for client
  for (const { name, path: fullPath } of islandFiles) {
    const islandPath = `islands/${name}`;
    
    try {
      // Bundle for client-side hydration using Bun
      const result = await Bun.build({
            entrypoints: [fullPath],
            outdir: "./dist/islands",
            target: "browser",
            format: "esm",
            minify: !isDev,
            // Externalize preact and signals - we'll load from esm.sh
            external: [
              "preact",
              "preact/hooks", 
              "preact/compat",
              "@preact/signals",
              "@preact/signals-core",
            ],
            define: {
              "process.env.NODE_ENV": isDev ? '"development"' : '"production"',
              "IS_BROWSER": "true",
            },
            plugins: [
              {
                name: "deco-browser-shims",
                setup(build) {
                  // Shim $fresh/runtime.ts for browser
                  build.onResolve({ filter: /\$fresh\/runtime\.ts$/ }, () => ({
                    path: join(__dirname, "browser-shims", "fresh-runtime.ts"),
                  }));
                  
                  // Shim deco/clients/withManifest.ts for browser
                  build.onResolve({ filter: /deco\/clients\/withManifest\.ts$/ }, () => ({
                    path: join(__dirname, "browser-shims", "with-manifest.ts"),
                  }));
                  
                  // Handle apps/ imports
                  build.onResolve({ filter: /^apps\// }, (args) => ({
                    path: join(__dirname, "browser-shims", "apps-stub.ts"),
                  }));
                }
              }
            ],
          });
          
          if (result.success && result.outputs.length > 0) {
            let bundledCode = await result.outputs[0].text();
            
            // Replace external imports with esm.sh URLs
            bundledCode = bundledCode
              .replace(/from\s*["']preact\/hooks["']/g, 'from "https://esm.sh/preact@10.23.1/hooks"')
              .replace(/from\s*["']preact\/compat["']/g, 'from "https://esm.sh/preact@10.23.1/compat"')
              .replace(/from\s*["']preact["']/g, 'from "https://esm.sh/preact@10.23.1"')
              .replace(/from\s*["']@preact\/signals-core["']/g, 'from "https://esm.sh/@preact/signals-core@1.8.0"')
              .replace(/from\s*["']@preact\/signals["']/g, 'from "https://esm.sh/@preact/signals@1.3.2"');
            
            islandBundles.set(islandPath, bundledCode);
            console.log(`    ✓ Bundled: ${islandPath}`);
          } else if (result.logs?.length) {
            console.warn(`  ⚠️ Bundle logs for ${islandPath}:`, result.logs.slice(0, 3));
          }
    } catch (bundleErr: any) {
      console.warn(`  ⚠️ Failed to bundle island: ${islandPath}`, bundleErr.message);
    }
  }
  
  console.log(`   Total: ${islandBundles.size} islands bundled\n`);
}

// =============================================================================
// Section Registry - Maps section paths to their components
// =============================================================================
const sectionRegistry = new Map<string, ComponentType<any>>();

async function registerSections() {
  const sectionsDir = join(__dirname, "sections");
  
  async function scanDir(dir: string, prefix = "") {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          await scanDir(fullPath, `${prefix}${entry}/`);
        } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
          const sectionName = `${prefix}${entry.replace(/\.(tsx?|jsx?)$/, "")}`;
          const sectionPath = `sections/${sectionName}`;
          
          try {
            const module = await import(fullPath);
            if (module.default) {
              sectionRegistry.set(sectionPath, module.default);
            }
          } catch (e) {
            console.warn(`  ⚠️ Failed to load section: ${sectionPath}`, e);
          }
        }
      }
    } catch (e) {
      // Directory doesn't exist
    }
  }
  
  console.log("📄 Registering sections...");
  await scanDir(sectionsDir);
  console.log(`   Total: ${sectionRegistry.size} sections\n`);
}

// =============================================================================
// Page Resolution - Load pages from .deco/blocks
// =============================================================================
interface PageConfig {
  name: string;
  path: string;
  sections: SectionRef[];
  seo?: { title?: string; description?: string };
}

interface SectionRef {
  ref?: string;
  type?: string;
  props?: Record<string, any>;
  __resolveType?: string;
}

function loadPages(): Map<string, PageConfig> {
  const pages = new Map<string, PageConfig>();
  const pagesDir = join(__dirname, ".deco", "blocks", "pages");
  
  try {
    const files = readdirSync(pagesDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      
      const content = readFileSync(join(pagesDir, file), "utf-8");
      const page = JSON.parse(content) as PageConfig;
      
      if (page.path) {
        pages.set(page.path, page);
        console.log(`   📄 Page: ${page.path} → ${file}`);
      }
    }
  } catch (e) {
    console.warn("   ⚠️ No pages found in .deco/blocks/pages");
  }
  
  return pages;
}

// =============================================================================
// Section Renderer
// =============================================================================
async function renderSection(
  sectionRef: SectionRef,
  req: Request
): Promise<VNode | null> {
  // Resolve section type
  let sectionPath: string | undefined;
  let props = sectionRef.props || {};
  
  if (sectionRef.ref) {
    // Load from .deco/blocks/sections
    const blockPath = join(__dirname, ".deco", "blocks", `${sectionRef.ref}.json`);
    try {
      const content = readFileSync(blockPath, "utf-8");
      const block = JSON.parse(content);
      // Get the section type and resolve it
      const blockType = block.__resolveType?.replace("site/", "") || block.type;
      
      // Map the block type to section path
      const typeMap: Record<string, string> = {
        "core/header/header": "sections/Header/Header",
        "core/footer/footer": "sections/Footer/Footer",
      };
      sectionPath = typeMap[blockType] || blockType;
      
      // Merge block props with section ref props
      props = { ...block, ...props };
      delete props.$schema;
      delete props.type;
      delete props.__resolveType;
    } catch (e) {
      console.warn(`Section ref not found: ${sectionRef.ref}`);
      return null;
    }
  } else if (sectionRef.__resolveType) {
    sectionPath = sectionRef.__resolveType.replace("site/", "");
  } else if (sectionRef.type) {
    // Map type names to section paths
    const typeMap: Record<string, string> = {
      // Core types from .deco/blocks
      "core/header/header": "sections/Header/Header",
      "core/footer/footer": "sections/Footer/Footer",
      "core-images/carousel": "sections/Images/Carousel",
      "core-images/imagegrid": "sections/Images/ImageGrid",
      "core-images/secondaryimagecarousel": "sections/Images/SecondaryImageCarousel",
      "core-content/benefits": "sections/Content/Benefits",
      "core-product/productshelf": "sections/Product/ProductShelf",
      "core-newsletter/newsletter": "sections/Newsletter/Newsletter",
    };
    sectionPath = typeMap[sectionRef.type] || sectionRef.type;
  }
  
  if (!sectionPath) {
    console.warn("Could not resolve section:", sectionRef);
    return null;
  }
  
  // Get the section component
  const Component = sectionRegistry.get(sectionPath);
  if (!Component) {
    console.warn(`Section not found: ${sectionPath}`);
    return <div class="error">Section not found: {sectionPath}</div>;
  }
  
  // Resolve any loader references in props
  props = await resolveLoaders(props, req);
  
  // Render the section
  try {
    return <Component {...props} />;
  } catch (e: any) {
    console.error(`Error rendering section ${sectionPath}:`, e);
    return <div class="error">Error: {e.message}</div>;
  }
}

// =============================================================================
// Loader Resolution
// =============================================================================
async function resolveLoaders(props: any, req: Request): Promise<any> {
  if (!props || typeof props !== "object") return props;
  
  // Handle arrays
  if (Array.isArray(props)) {
    return Promise.all(props.map(item => resolveLoaders(item, req)));
  }
  
  // Check if this object is a loader reference
  if (props.__resolveType && typeof props.__resolveType === "string") {
    const loaderPath = props.__resolveType;
    
    // Skip if it's already resolved
    if (loaderPath === "resolved") {
      return props.data ? resolveLoaders(props.data, req) : null;
    }
    
    // Try to execute the loader
    try {
      const resolved = await executeLoader(loaderPath, props.props || props, req);
      return resolved;
    } catch (e) {
      console.warn(`Failed to resolve loader: ${loaderPath}`, e);
      return null; // Return null for failed loaders
    }
  }
  
  // Recursively resolve nested objects
  const resolved: any = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "__resolveType" || key === "$schema") continue;
    resolved[key] = await resolveLoaders(value, req);
  }
  
  return resolved;
}

// Loader registry
const loaderRegistry = new Map<string, Function>();

// VTEX context cache
let vtexContext: any = null;

// Default segment for VTEX
const DEFAULT_SEGMENT = {
  utm_campaign: null,
  utm_source: null,
  utmi_campaign: null,
  channel: "1",
  priceTables: null,
  regionId: null,
  campaigns: null,
  payload: {
    currencyCode: "BRL",
    currencySymbol: "R$",
    countryCode: "BRA",
    cultureInfo: "pt-BR",
    channel: "1",
  }
};

// Initialize VTEX context from config
async function getVtexContext() {
  if (vtexContext) return vtexContext;
  
  try {
    // Load VTEX config
    const configPath = join(__dirname, ".deco/blocks/deco-vtex.json");
    const configContent = readFileSync(configPath, "utf-8");
    const config = JSON.parse(configContent);
    
    const account = config.account || "brmotorolanew";
    const publicUrl = config.publicUrl?.startsWith("https://") 
      ? config.publicUrl 
      : `https://${config.publicUrl}`;
    
    // Create a simple HTTP client for VTEX API
    const vcsDeprecated = {
      "GET /api/catalog_system/pub/products/search/:term?"(params: any, options?: any) {
        const url = new URL(`${publicUrl}/api/catalog_system/pub/products/search/`);
        
        // Add query params
        if (params._from !== undefined) url.searchParams.set("_from", String(params._from));
        if (params._to !== undefined) url.searchParams.set("_to", String(params._to));
        if (params.ft) url.searchParams.set("ft", params.ft);
        if (params.O) url.searchParams.set("O", params.O);
        if (params.fq) {
          const fqs = Array.isArray(params.fq) ? params.fq : [params.fq];
          fqs.forEach((fq: string) => url.searchParams.append("fq", fq));
        }
        
        console.log(`  🔄 Fetching products from: ${url.toString()}`);
        
        return fetch(url.toString(), {
          headers: {
            "Accept": "application/json",
            ...(options?.headers || {}),
          },
        });
      }
    };
    
    // Create a bag to hold segment data
    const bag = new Map();
    bag.set("segment", DEFAULT_SEGMENT);
    
    vtexContext = {
      vcsDeprecated,
      account,
      publicUrl,
      bag,
      // Add default segment getter for loaders that access it directly
      get segment() { return DEFAULT_SEGMENT; },
    };
    
    console.log(`  ✅ VTEX context initialized: ${account}`);
    return vtexContext;
  } catch (e) {
    console.warn("Failed to initialize VTEX context:", e);
    return null;
  }
}

// Execute a loader by path
async function executeLoader(loaderPath: string, props: any, req: Request): Promise<any> {
  // Handle VTEX product loaders directly
  if (loaderPath.includes("productList") || loaderPath.includes("productListingPage")) {
    return await fetchVtexProducts(props);
  }
  
  if (loaderPath.includes("suggestions")) {
    return { products: [], searches: [] };
  }
  
  // Check if loader is registered
  let loader = loaderRegistry.get(loaderPath);
  
  if (!loader) {
    // Try to dynamically import the loader
    try {
      const normalizedPath = loaderPath
        .replace(/^vtex\//, "apps/vtex/")
        .replace(/^website\//, "apps/website/")
        .replace(/^commerce\//, "apps/commerce/");
      
      const module = await import(`./${normalizedPath}`).catch(() => 
        import(`apps/${loaderPath}`)
      );
      
      loader = module.default || module.loader;
      if (loader) {
        loaderRegistry.set(loaderPath, loader);
      }
    } catch (e) {
      // Loader not found, return mock data for development
      console.log(`  📦 Loader not found: ${loaderPath} - using mock data`);
      return getMockData(loaderPath);
    }
  }
  
  if (loader) {
    try {
      // Get VTEX context for VTEX loaders
      const ctx = loaderPath.startsWith("vtex/") ? await getVtexContext() : {};
      
      if (!ctx && loaderPath.startsWith("vtex/")) {
        console.log(`  ⚠️ No VTEX context available for: ${loaderPath}`);
        return getMockData(loaderPath);
      }
      
      return await loader(props, req, ctx);
    } catch (e: any) {
      console.warn(`Loader execution failed: ${loaderPath}`, e.message || e);
      return getMockData(loaderPath);
    }
  }
  
  return null;
}

// Fetch products directly from VTEX API
async function fetchVtexProducts(props: any): Promise<any[]> {
  try {
    const ctx = await getVtexContext();
    if (!ctx) return getMockData("productList");
    
    const count = props?.count || props?.props?.count || 12;
    const term = props?.term || props?.props?.term || "";
    
    const url = new URL(`${ctx.publicUrl}/api/catalog_system/pub/products/search/`);
    url.searchParams.set("_from", "0");
    url.searchParams.set("_to", String(count - 1));
    if (term && term.trim()) {
      url.searchParams.set("ft", encodeURIComponent(term.trim()));
    }
    
    console.log(`  🔄 Fetching VTEX products: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: { "Accept": "application/json" },
    });
    
    if (!response.ok) {
      console.warn(`VTEX API error: ${response.status}`);
      return getMockData("productList");
    }
    
    const vtexProducts = await response.json();
    
    if (!Array.isArray(vtexProducts) || vtexProducts.length === 0) {
      console.warn("No products returned from VTEX");
      return getMockData("productList");
    }
    
    console.log(`  ✅ Fetched ${vtexProducts.length} products from VTEX`);
    
    // Transform VTEX format to schema.org Product format
    return vtexProducts.map((p: any) => transformVtexProduct(p, ctx.publicUrl));
  } catch (e: any) {
    console.warn("Failed to fetch VTEX products:", e.message);
    return getMockData("productList");
  }
}

// Transform VTEX product to schema.org format
function transformVtexProduct(vtexProduct: any, baseUrl: string): any {
  const item = vtexProduct.items?.[0] || {};
  const seller = item.sellers?.[0];
  const offer = seller?.commertialOffer;
  const images = item.images || [];
  
  return {
    "@type": "Product",
    productID: vtexProduct.productId,
    name: item.name || vtexProduct.productName,
    url: `${vtexProduct.link}`,
    sku: item.itemId,
    gtin: item.ean,
    description: vtexProduct.description,
    brand: { "@type": "Brand", name: vtexProduct.brand },
    category: vtexProduct.categories?.[0] || "",
    image: images.map((img: any) => ({
      "@type": "ImageObject",
      url: img.imageUrl,
      alternateName: img.imageText || vtexProduct.productName,
    })),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: offer?.Price || 0,
      highPrice: offer?.ListPrice || offer?.Price || 0,
      offers: [{
        "@type": "Offer",
        price: offer?.Price || 0,
        availability: offer?.AvailableQuantity > 0 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
        seller: seller?.sellerId || "1",
        priceSpecification: [
          {
            "@type": "UnitPriceSpecification",
            priceType: "https://schema.org/ListPrice",
            price: offer?.ListPrice || offer?.Price || 0,
          },
          ...(offer?.Installments || []).map((inst: any) => ({
            "@type": "UnitPriceSpecification",
            priceComponentType: "https://schema.org/Installment",
            name: inst.PaymentSystemName,
            billingDuration: inst.NumberOfInstallments,
            billingIncrement: inst.Value,
            price: inst.TotalValuePlusInterestRate,
          })),
        ],
      }],
    },
    isVariantOf: {
      "@type": "ProductGroup",
      name: vtexProduct.productName,
      productGroupID: vtexProduct.productId,
      hasVariant: [],
    },
  };
}

// Mock data for development when VTEX is not configured
function getMockData(loaderPath: string): any {
  if (loaderPath.includes("productList") || loaderPath.includes("productShelf")) {
    // Return mock products
    return [
      {
        "@type": "Product",
        productID: "1",
        name: "Sample Product 1",
        url: "/sample-product-1/p",
        sku: "SKU001",
        image: [{ url: "https://picsum.photos/seed/prod1/300/400", alternateName: "Product 1" }],
        offers: {
          "@type": "AggregateOffer",
          lowPrice: 99.99,
          highPrice: 99.99,
          offers: [{
            "@type": "Offer",
            price: 99.99,
            availability: "https://schema.org/InStock",
            seller: "1",
            priceSpecification: []
          }]
        },
        isVariantOf: { name: "Sample Product 1", productGroupID: "1" }
      },
      {
        "@type": "Product",
        productID: "2",
        name: "Sample Product 2",
        url: "/sample-product-2/p",
        sku: "SKU002",
        image: [{ url: "https://picsum.photos/seed/prod2/300/400", alternateName: "Product 2" }],
        offers: {
          "@type": "AggregateOffer",
          lowPrice: 149.99,
          highPrice: 149.99,
          offers: [{
            "@type": "Offer",
            price: 149.99,
            availability: "https://schema.org/InStock",
            seller: "1",
            priceSpecification: []
          }]
        },
        isVariantOf: { name: "Sample Product 2", productGroupID: "2" }
      },
      {
        "@type": "Product",
        productID: "3",
        name: "Sample Product 3",
        url: "/sample-product-3/p",
        sku: "SKU003",
        image: [{ url: "https://picsum.photos/seed/prod3/300/400", alternateName: "Product 3" }],
        offers: {
          "@type": "AggregateOffer",
          lowPrice: 199.99,
          highPrice: 199.99,
          offers: [{
            "@type": "Offer",
            price: 199.99,
            availability: "https://schema.org/InStock",
            seller: "1",
            priceSpecification: []
          }]
        },
        isVariantOf: { name: "Sample Product 3", productGroupID: "3" }
      },
      {
        "@type": "Product",
        productID: "4",
        name: "Sample Product 4",
        url: "/sample-product-4/p",
        sku: "SKU004",
        image: [{ url: "https://picsum.photos/seed/prod4/300/400", alternateName: "Product 4" }],
        offers: {
          "@type": "AggregateOffer",
          lowPrice: 79.99,
          highPrice: 79.99,
          offers: [{
            "@type": "Offer",
            price: 79.99,
            availability: "https://schema.org/InStock",
            seller: "1",
            priceSpecification: []
          }]
        },
        isVariantOf: { name: "Sample Product 4", productGroupID: "4" }
      }
    ];
  }
  
  if (loaderPath.includes("suggestions")) {
    return { products: [], searches: [] };
  }
  
  return null;
}

// =============================================================================
// Page Renderer
// =============================================================================
async function renderPage(page: PageConfig, req: Request): Promise<string> {
  islandCounter = 0; // Reset island counter for each page
  
  const sections: VNode[] = [];
  
  for (const sectionRef of page.sections) {
    const rendered = await renderSection(sectionRef, req);
    if (rendered) {
      sections.push(rendered);
    }
  }
  
  const body = renderToString(
    <div id="app">
      {sections}
    </div>
  );
  
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.seo?.title || page.name || siteName}</title>
  <meta name="description" content="${page.seo?.description || ""}">
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.24/dist/full.min.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/styles.css">
  <style>
    /* Ensure modal is hidden by default */
    .modal-toggle:not(:checked) ~ .modal { display: none; }
    .modal-toggle:checked ~ .modal { display: grid; }
  </style>
</head>
<body>
  ${body}
  <script type="module" src="/hydrate.js"></script>
</body>
</html>`;
}

// =============================================================================
// Admin API Endpoints
// =============================================================================
app.get("/deco/meta", async (c) => {
  const sections: Record<string, any> = {};
  for (const [path] of sectionRegistry) {
    sections[path] = { $ref: path, namespace: "site" };
  }
  
  return c.json({
    major: 1,
    namespace: "site",
    version: "1.0.0",
    schema: { definitions: {}, root: {} },
    manifest: { 
      blocks: { 
        sections,
        loaders: {},
        actions: {},
      } 
    },
    site: siteName,
    timestamp: Date.now(),
  });
});

app.post("/deco/invoke", async (c) => {
  const payload = await c.req.json();
  const results: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(payload)) {
    const { key: loaderKey, props } = value as { key: string; props?: any };
    
    // Load and execute the loader/action
    try {
      const loaderPath = join(__dirname, loaderKey.replace("site/", ""));
      const module = await import(loaderPath);
      
      if (module.default) {
        results[key] = await module.default(props, c.req.raw);
      } else if (module.loader) {
        results[key] = await module.loader(props, c.req.raw);
      } else if (module.action) {
        results[key] = await module.action(props, c.req.raw);
      } else {
        results[key] = null;
      }
    } catch (e: any) {
      console.error(`Error invoking ${loaderKey}:`, e);
      results[key] = { error: e.message };
    }
  }
  
  return c.json(results);
});

app.get("/.decofile", async (c) => {
  const decofilePath = join(__dirname, ".deco", "decofile.json");
  if (existsSync(decofilePath)) {
    return c.json(JSON.parse(readFileSync(decofilePath, "utf-8")));
  }
  return c.json({ site: siteName, blocks: {} });
});

// =============================================================================
// Static Files
// =============================================================================
app.get("/styles.css", async (c) => {
  const cssPath = join(__dirname, "static", "styles.css");
  if (existsSync(cssPath)) {
    return c.body(readFileSync(cssPath, "utf-8"), {
      headers: { "Content-Type": "text/css" },
    });
  }
  return c.body("", { headers: { "Content-Type": "text/css" } });
});

// Serve bundled islands
app.get("/islands/:folder/:name.js", async (c) => {
  const folder = c.req.param("folder");
  const name = c.req.param("name");
  const islandPath = `islands/${folder}/${name}`;
  
  const bundle = islandBundles.get(islandPath);
  if (bundle) {
    return c.body(bundle, {
      headers: { 
        "Content-Type": "application/javascript",
        "Cache-Control": isDev ? "no-cache" : "public, max-age=31536000",
      },
    });
  }
  
  return c.text("Island not found: " + islandPath, 404);
});

// Preact runtime for hydration
app.get("/preact.js", async (c) => {
  const preactBundle = `
// Preact runtime bundle
import { h, render, hydrate, Component, Fragment, createContext, createRef } from 'https://esm.sh/preact@10.23.1';
import { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer, useLayoutEffect } from 'https://esm.sh/preact@10.23.1/hooks';
import { signal, computed, effect, batch } from 'https://esm.sh/@preact/signals@1.3.2';

export { h, render, hydrate, Component, Fragment, createContext, createRef };
export { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer, useLayoutEffect };
export { signal, computed, effect, batch };
`;
  return c.body(preactBundle, {
    headers: { "Content-Type": "application/javascript" },
  });
});

// Hydration script
app.get("/hydrate.js", async (c) => {
  // Get list of islands used on this page
  const islandPaths = Array.from(islandBundles.keys());
  
  const script = `
// Island Hydration Script - Fresh 2 Style
(async () => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }
  
  // Import Preact from esm.sh
  const { h, render, hydrate } = await import('https://esm.sh/preact@10.23.1');
  const hooks = await import('https://esm.sh/preact@10.23.1/hooks');
  const signals = await import('https://esm.sh/@preact/signals@1.3.2');
  
  // Make hooks and signals available globally for islands
  window.__PREACT__ = { h, render, hydrate, ...hooks, ...signals };
  
  const islands = document.querySelectorAll('[data-island]');
  console.log('[Hydration] Found', islands.length, 'islands to hydrate');
  
  for (const island of islands) {
    const islandPath = island.getAttribute('data-island');
    const propsStr = island.getAttribute('data-island-props');
    let props = {};
    
    try {
      props = propsStr ? JSON.parse(propsStr) : {};
    } catch (e) {
      console.warn('[Hydration] Failed to parse props for', islandPath);
    }
    
    try {
      // Dynamic import of the bundled island
      const module = await import('/' + islandPath + '.js');
      const Component = module.default;
      
      if (Component) {
        // Hydrate: reuse existing DOM, attach event listeners
        hydrate(h(Component, props), island);
        console.log('[Hydration] ✓ Hydrated:', islandPath);
      } else {
        console.warn('[Hydration] No default export for:', islandPath);
      }
    } catch (e) {
      console.warn('[Hydration] ✗ Failed to hydrate:', islandPath, e.message);
    }
  }
  
  console.log('[Hydration] Complete!');
})();
`;
  return c.body(script, {
    headers: { 
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
    },
  });
});

// =============================================================================
// Page Routes
// =============================================================================
const pages = new Map<string, PageConfig>();

app.get("/*", async (c) => {
  const path = c.req.path;
  
  // Set device from User-Agent
  const ua = c.req.header("user-agent") || "";
  setDevice(detectDeviceFromUA(ua));
  
  // Find matching page
  let matchedPage: PageConfig | undefined;
  
  // Exact match first
  matchedPage = pages.get(path);
  
  // Try wildcard match
  if (!matchedPage) {
    for (const [pattern, page] of pages) {
      if (pattern === "/*" || pattern === "/[...catchall]") {
        matchedPage = page;
        break;
      }
    }
  }
  
  if (!matchedPage) {
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head><title>404 - Not Found</title></head>
      <body>
        <h1>404 - Page Not Found</h1>
        <p>Path: ${path}</p>
        <p><a href="/">Go Home</a></p>
      </body>
      </html>
    `, 404);
  }
  
  const html = await renderPage(matchedPage, c.req.raw);
  return c.html(html);
});

// =============================================================================
// Startup
// =============================================================================
async function start() {
  console.log(`
🥟 Starting ${siteName} on Bun...
   Mode: ${isDev ? "development" : "production"}
`);
  
  // Register components
  await registerIslands();
  await registerSections();
  
  // Load pages
  console.log("📄 Loading pages...");
  const loadedPages = loadPages();
  for (const [path, page] of loadedPages) {
    pages.set(path, page);
  }
  console.log(`   Total: ${pages.size} pages\n`);
  
  console.log(`
✅ ${siteName} server ready!

   🌐 Local:      http://localhost:${port}
   📋 Meta API:   http://localhost:${port}/deco/meta
   🔧 Invoke API: http://localhost:${port}/deco/invoke

   Site name: "${siteName}" (inferred from folder)
   Framework: Vite + Preact Islands
`);
  
  Bun.serve({
    fetch: app.fetch,
    port,
  });
}

start().catch(console.error);
