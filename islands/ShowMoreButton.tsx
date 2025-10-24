import { useEffect, useRef } from "preact/hooks";

interface Props {
  children: preact.ComponentChildren;
}

export default function ShowMoreButton({ children }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const button = buttonRef.current?.querySelector("button");
    if (!button) return;

    const handleClick = () => {
      // Remove o botão após o clique
      if (buttonRef.current) {
        buttonRef.current.style.display = "none";
      }
    };

    button.addEventListener("click", handleClick);

    return () => {
      button.removeEventListener("click", handleClick);
    };
  }, []);

  return <div ref={buttonRef}>{children}</div>;
}
