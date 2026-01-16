
import ChatIsland from "../islands/Chat.tsx";

interface Props {
  /**
   * @title Título da seção
   * @description Título que aparece acima do chat
   */
  title?: string;
  /**
   * @title Mostrar chat em tela cheia
   * @description Se habilitado, o chat ocupará toda a tela
   */
  fullScreen?: boolean;
  /**
   * @title Cor do tema
   * @description Cor principal do chat
   */
  themeColor?: "blue" | "green" | "purple" | "red";
}

export default function Chat({ 
  title = defaultProps.title,
  fullScreen = defaultProps.fullScreen,
  themeColor = defaultProps.themeColor 
}: Props) {
  return (
    <div class="container mx-auto px-4 py-8">
      {title && (
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p class="text-gray-600">Converse conosco e tire suas dúvidas</p>
        </div>
      )}
      
      <div class={`${fullScreen ? "h-screen" : "h-auto"} flex items-center justify-center`}>
        <ChatIsland themeColor={themeColor} />
      </div>
    </div>
  );
}

const defaultProps: Props = {
  title: "Chat de Atendimento",
  fullScreen: false,
  themeColor: "blue"
};

export function Preview() {
  return <Chat {...defaultProps} />;
}