import { useEffect, useRef, useState } from "preact/hooks";

interface Props {
  children: preact.ComponentChildren;
  productsPerPage: number;
}

export default function ShowMoreButton({ children, productsPerPage }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const button = buttonRef.current?.querySelector("button");
    if (!button) return;

    const handleClick = () => {
      setIsLoading(true);

      const container = buttonRef.current?.parentElement;
      if (!container) return;

      const allLists = container.querySelectorAll("[data-product-list]");
      const lastList = allLists[allLists.length - 1];

      if (!lastList) return;

      const currentPage = lastList.getAttribute("data-product-list");
      if (!currentPage) return;

      const nextPage = String(Number(currentPage) + 1);

      const checkForNextPage = () => {
        const nextList = document.querySelector(
          `[data-product-list="${nextPage}"]`,
        );

        if (nextList) {
          if (buttonRef.current) {
            buttonRef.current.style.display = "none";
          }

          // Atualiza o contador de resultados
          const resultsCounter = document.querySelector("[data-results-count]");
          if (resultsCounter) {
            // Extrai o total de registros do texto atual
            const currentText = resultsCounter.textContent || "";
            const totalMatch = currentText.match(/of (\d+)/);
            const totalRecords = Number(totalMatch ? totalMatch[1] : "0");

            // Calcula a quantidade total de produtos visíveis
            const currentPageNumber = Number(nextPage);
            const totalProductsShown = currentPageNumber * productsPerPage;

            // Garante que não ultrapassa o total de registros
            const displayCount = Math.min(totalProductsShown, totalRecords);

            // Atualiza o texto
            resultsCounter.textContent =
              `${displayCount} of ${totalRecords} results`;
          }

          return true;
        }
        return false;
      };

      const observer = new MutationObserver(() => {
        if (checkForNextPage()) {
          observer.disconnect();
          setIsLoading(false);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        setIsLoading(false);
      }, 10000);
    };

    button.addEventListener("click", handleClick);

    return () => {
      button.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div ref={buttonRef}>
      {isLoading
        ? (
          <div class="flex justify-center items-center pt-2 sm:pt-10 w-full">
            <span class="loading loading-spinner loading-md" />
          </div>
        )
        : children}
    </div>
  );
}
