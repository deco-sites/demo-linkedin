import { AppContext } from "../../apps/site.ts";

interface ChatStreamProps {
  message: string;
  threadId?: string;
  model?: string;
  instructions?: string;
  maxTokens?: number;
}

interface StreamMessage {
  id: string;
  role: "user" | "assistant";
  parts: Array<{
    type: "text";
    text: string;
  }>;
}

const DEFAULT_INSTRUCTIONS = "quando o usuário falar oi, responda **APENAS olá**";

export default async function action(props: ChatStreamProps, _req: Request, _ctx: AppContext) {
  const { message, threadId, model = "anthropic:claude-sonnet-4.5", instructions = DEFAULT_INSTRUCTIONS, maxTokens = 32768 } = props;

  if (!message?.trim()) {
    return {
      error: true,
      message: "Message is required"
    };
  }

  // Gerar um threadId único se não fornecido
  const currentThreadId = threadId || crypto.randomUUID();

  // Criar mensagem do usuário
  const userMessage: StreamMessage = {
    id: crypto.randomUUID(),
    role: "user",
    parts: [{
      type: "text",
      text: message.trim()
    }]
  };

  // Payload para a API do Deco (baseado no exemplo fornecido)
  const payload = {
    "metadata": {
      "threadId": currentThreadId
    },
    "args": [
      [userMessage],
      {
        "model": model,
        "instructions": instructions,
        "tools": {},
        "maxSteps": 15,
        "lastMessages": 8,
        "maxTokens": maxTokens,
        "bypassOpenRouter": false,
        "context": [{
          "id": crypto.randomUUID(),
          "role": "system",
          "parts": [{
            "type": "text",
            "text": "Open integrations: i:agent-management"
          }]
        }]
      }
    ]
  };

  try {
    console.log("Sending payload:", JSON.stringify(payload, null, 2));
    
    // Fazer a requisição para a API de stream do Deco
    const response = await fetch("https://api.decocms.com/actors/AIAgent/invoke/stream", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "priority": "u=1, i",
        "sec-ch-ua": '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-deno-isolate-instance-id": "",
        "x-trace-debug-id": crypto.randomUUID(),
        "Cookie": ""
      },
      body: JSON.stringify(payload),
    });

    console.log("response", response);

    if (!response.ok) {
      // Ler o corpo da resposta para entender o erro
      const errorText = await response.text();
      console.error("API Error:", response.status, response.statusText, errorText);
      throw new Error(`Stream API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Para actions, vamos retornar o stream diretamente para o cliente processar
    // Isso permite streaming em tempo real no frontend
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

  } catch (error) {
    console.error("Chat stream action error:", error);
    
    return {
      error: true,
      message: error instanceof Error ? error.message : "Erro desconhecido no chat",
      fallback: "Desculpe, não consegui processar sua mensagem no momento. Tente novamente."
    };
  }
}
