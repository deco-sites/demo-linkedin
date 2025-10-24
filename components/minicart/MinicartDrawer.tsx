import { MINICART_DRAWER_ID } from "../../constants.ts";
import Drawer from "../ui/Drawer.tsx";
import MinicartContent from "../../islands/MinicartContent.tsx";

export default function MinicartDrawer({
  freeShippingTarget: _freeShippingTarget,
}: {
  freeShippingTarget?: number;
}) {
  // This component will be rendered server-side
  // Cart state will be managed by the MinicartContent island

  return (
    <Drawer
      id={MINICART_DRAWER_ID}
      class="drawer-end z-50"
      aside={
        <Drawer.Aside title="My Bag" drawer={MINICART_DRAWER_ID}>
          <div
            class="h-full flex flex-col bg-base-100 items-center justify-center overflow-auto"
            style={{
              minWidth: "calc(min(100vw, 425px))",
              maxWidth: "425px",
            }}
          >
            <MinicartContent freeShippingTarget={_freeShippingTarget} />
          </div>
        </Drawer.Aside>
      }
    />
  );
}
