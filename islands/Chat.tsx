
import { useState, useEffect, useRef } from "preact/hooks";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface Props {
  themeColor?: "blue" | "green" | "purple" | "red";
}

export default function Chat({ themeColor = "blue" }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mensagens fake iniciais
  useEffect(() => {
    const initialMessages: Message[] = [];
    setMessages(initialMessages);
  }, []);

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: Event) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    const messageText = inputText;
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      // Criar mensagem do bot que será atualizada com o stream
      const botMessageId = (Date.now() + 1).toString();
      const initialBotMessage: Message = {
        id: botMessageId,
        text: "",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, initialBotMessage]);

      // Fazer requisição para a action de chat stream
      const response = await fetch("/live/invoke/site/actions/chat/stream.ts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          threadId: crypto.randomUUID(), // Gerar novo thread para cada conversa
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Processar o stream de resposta
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.slice(6).trim();
                if (!dataStr || dataStr === '[DONE]') continue;
                
                const data = JSON.parse(dataStr);
                
                if (data.error) {
                  throw new Error(data.message);
                }

                // Processar diferentes formatos de resposta do stream
                let newText = "";
                if (data.choices && data.choices[0]?.delta?.content) {
                  newText = data.choices[0].delta.content;
                } else if (data.content) {
                  newText = data.content;
                } else if (data.text) {
                  newText = data.text;
                } else if (data.delta) {
                  newText = data.delta;
                } else if (typeof data === 'string') {
                  newText = data;
                }

                if (newText) {
                  accumulatedText += newText;
                  
                  // Atualizar a mensagem do bot em tempo real
                  setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId 
                      ? { ...msg, text: accumulatedText }
                      : msg
                  ));
                }
              } catch (_parseError) {
                // Se não conseguir fazer parse, pode ser texto simples
                const textContent = line.slice(6).trim();
                if (textContent && textContent !== 'data:') {
                  accumulatedText += textContent;
                  setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId 
                      ? { ...msg, text: accumulatedText }
                      : msg
                  ));
                }
              }
            }
          }
        }
      }

      setIsTyping(false);

      // Se não recebeu nenhum texto, usar resposta padrão
      if (!accumulatedText.trim()) {
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, text: "Resposta processada com sucesso." }
            : msg
        ));
      }

    } catch (error) {
      console.error("Erro no stream:", error);
      setIsTyping(false);

      // Fallback para resposta de erro
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "Desculpe, ocorreu um erro. Vou usar uma resposta simulada por enquanto.",
        sender: "bot",
        timestamp: new Date(),
      };

      // Remover mensagem vazia do bot e adicionar mensagem de erro
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.text !== "");
        return [...filtered, errorMessage];
      });

      // Fallback para resposta fake após erro
      setTimeout(() => {
        const botResponses = [
          "Entendi! Deixe-me verificar isso para você.",
          "Ótima pergunta! Vou buscar essas informações.",
          "Claro! Posso te ajudar com isso.",
          "Interessante! Vou encontrar a melhor opção para você.",
          "Perfeito! Aqui estão algumas sugestões.",
        ];

        const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
        
        const fallbackMessage: Message = {
          id: (Date.now() + 3).toString(),
          text: randomResponse,
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, fallbackMessage]);
      }, 1000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  // Cores do tema
  const themeColors = {
    blue: {
      header: "bg-blue-600",
      headerHover: "bg-blue-500", 
      message: "bg-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      ring: "focus:ring-blue-500"
    },
    green: {
      header: "bg-green-600",
      headerHover: "bg-green-500",
      message: "bg-green-600", 
      button: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
      ring: "focus:ring-green-500"
    },
    purple: {
      header: "bg-purple-600",
      headerHover: "bg-purple-500",
      message: "bg-purple-600",
      button: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500", 
      ring: "focus:ring-purple-500"
    },
    red: {
      header: "bg-red-600",
      headerHover: "bg-red-500",
      message: "bg-red-600",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      ring: "focus:ring-red-500"
    }
  };

  const colors = themeColors[themeColor];

  return (
    <div class="flex flex-col h-96 max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header do Chat */}
      <div class={`flex items-center justify-between p-4 ${colors.header} text-white rounded-t-lg`}>
        <div class="flex items-center space-x-3">
          <div class={`w-8 h-8 ${colors.headerHover} rounded-full flex items-center justify-center`}>
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold">Assistente Virtual</h3>
            <p class="text-xs opacity-80">Online</p>
          </div>
        </div>
        <button type="button" class="opacity-80 hover:opacity-100">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Área das Mensagens */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            class={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div             class={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.sender === "user"
                ? `${colors.message} text-white rounded-br-none`
                : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
            }`}>
              <p class="text-sm">{message.text}</p>
              <p class={`text-xs mt-1 ${
                message.sender === "user" ? "opacity-80" : "text-gray-500"
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* Indicador de digitação */}
        {isTyping && (
          <div class="flex justify-start">
            <div class="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-2">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div class="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <form onSubmit={handleSendMessage} class="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.currentTarget.value)}
            placeholder="Digite sua mensagem..."
            class={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${colors.ring} focus:border-transparent`}
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            class={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${colors.button}`}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}