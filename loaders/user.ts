import { Person } from "apps/commerce/types.ts";
import { AppContext } from "../apps/site.ts";
import { usePlatform } from "../sdk/hooks/usePlatform.tsx";

import { AppContext as AppContextVTEX } from "apps/vtex/mod.ts";
import { AppContext as AppContextShopify } from "apps/shopify/mod.ts";
import { AppContext as AppContextWake } from "apps/wake/mod.ts";

async function loader(
  _: unknown,
  _req: Request,
  ctx: AppContext,
): Promise<Person | null> {
  const platform = usePlatform();

  if (platform === "vtex") {
    const vtex = ctx as unknown as AppContextVTEX;

    return await vtex.invoke("vtex/loaders/user.ts");
  }
  if (platform === "shopify") {
    const shopify = ctx as unknown as AppContextShopify;
    return await shopify.invoke("shopify/loaders/user.ts");
  }

  if (platform === "wake") {
    const wake = ctx as unknown as AppContextWake;
    return await wake.invoke("wake/loaders/user.ts");
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

export default loader;
