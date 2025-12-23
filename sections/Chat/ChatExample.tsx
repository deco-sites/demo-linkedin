import ChatIsland from "../../islands/Chat.tsx";

interface Props {
  /**
   * @title Título da página de exemplo
   * @description Título que aparece na página de teste do chat
   */
  title?: string;
  /**
   * @title Subtítulo
   * @description Descrição que aparece abaixo do título
   */
  subtitle?: string;
  /**
   * @title Cor do tema do chat
   * @description Cor principal do chat
   */
  themeColor?: "blue" | "green" | "purple" | "red";
}

export default function ChatExample({ 
  title = defaultProps.title,
  subtitle = defaultProps.subtitle,
  themeColor = defaultProps.themeColor 
}: Props) {
  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div class="container mx-auto px-4">
        {/* Header da página */}
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Área do Chat */}
        <div class="flex justify-center">
          <div class="w-full max-w-2xl">
            <ChatIsland themeColor={themeColor} />
          </div>
        </div>

        {/* Informações sobre o chat */}
        <div class="mt-12 text-center">
          <div class="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">
              💬 Chat com IA Integrado
            </h3>
            <div class="text-sm text-gray-600 space-y-2">
              <p>✅ Conectado com a API do Deco CMS</p>
              <p>✅ Streaming de respostas em tempo real</p>
              <p>✅ Interface responsiva e moderna</p>
              <p>✅ Múltiplos temas de cores disponíveis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const defaultProps: Props = {
  title: "Chat com IA - Demo LinkedIn",
  subtitle: "Experimente nosso chat inteligente integrado com a API do Deco CMS. Digite uma mensagem e veja a magia acontecer!",
  themeColor: "blue"
};

export function Preview() {
  return <ChatExample {...defaultProps} />;
}
