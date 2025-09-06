import type { SiteNavigationElement } from "apps/commerce/types.ts";
import Image from "apps/website/components/Image.tsx";
import { NAVBAR_HEIGHT_DESKTOP } from "../../constants.ts";

function NavItem({ item }: { item: SiteNavigationElement }) {
  const { url, name, children } = item;
  const image = item?.image?.[0];

  return (
    <li
      class="group flex items-center"
      style={{ height: NAVBAR_HEIGHT_DESKTOP }}
    >
      <a
        href={url}
        class="group-hover:bg-[#fff] px-2.5 py-1 rounded-full text-sm z-20"
      >
        {name}
      </a>

      {children && children.length > 0 &&
        (
          <div
            class="absolute background pt-4 max-w-full hidden p-3 hover:flex group-hover:flex z-10 items-start justify-center gap-6 w-full rounded-lg"
            style={{
              top: "calc(100% - 16px)",
              left: "0px",
            }}
          >
            {image?.url && (
              <Image
                class="p-6"
                src={image.url}
                alt={image.alternateName}
                width={300}
                height={332}
                loading="lazy"
              />
            )}
            <ul class="flex flex-col items-start justify-start gap-2 container">
              {children.map((node) => (
                <li class="p-3 pl-0">
                  <a class="text-[12px]" href={node.url}>
                    <span>{node.name}</span>
                  </a>

                  <ul class="flex flex-col gap-1 mt-4">
                    {node.children?.map((leaf) => (
                      <li>
                        <a class="" href={leaf.url}>
                          <span class="text-lg">{leaf.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
    </li>
  );
}

export default NavItem;
