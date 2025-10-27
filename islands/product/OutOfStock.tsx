import { useState } from "preact/hooks";
import type { Product } from "apps/commerce/types.ts";

export interface Props {
  productID: Product["productID"];
}

export default function OutOfStock({ productID }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skuId: productID,
          name: name.trim(),
          email: email.trim(),
        }),
      });

      if (response.ok) {
        setStatus("success");
        setName("");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Failed to submit notification request:", error);
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div class="form-control justify-start gap-2">
        <span class="text-base text-green-600">
          Você será notificado quando o produto estiver disponível!
        </span>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          onClick={() => setStatus("idle")}
        >
          Notificar outro produto
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div class="form-control justify-start gap-2">
        <span class="text-base text-red-600">
          Erro ao enviar notificação. Tente novamente.
        </span>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          onClick={() => setStatus("idle")}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <form class="form-control justify-start gap-2" onSubmit={handleSubmit}>
      <span class="text-base">Este produto está indisponivel no momento</span>
      <span class="text-sm">Avise-me quando estiver disponivel</span>

      <input
        placeholder="Nome"
        class="input input-bordered"
        name="name"
        value={name}
        onInput={(e) => setName((e.target as HTMLInputElement).value)}
        required
      />
      <input
        placeholder="Email"
        class="input input-bordered"
        name="email"
        type="email"
        value={email}
        onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
        required
      />

      <button
        type="submit"
        class="btn btn-primary no-animation"
        disabled={isLoading || !name.trim() || !email.trim()}
      >
        <span class={isLoading ? "hidden" : "inline"}>Enviar</span>
        <span class={isLoading ? "inline" : "hidden"}>
          <span class="loading loading-spinner loading-xs" />
        </span>
      </button>
    </form>
  );
}
