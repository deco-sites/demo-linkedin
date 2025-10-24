const colors: Record<string, string | undefined> = {
  "White": "white",
  "Black": "black",
  "Gray": "gray",
  "Blue": "#99CCFF",
  "Green": "#aad1b5",
  "Yellow": "#F1E8B0",
  "DarkBlue": "#4E6E95",
  "LightBlue": "#bedae4",
  "DarkGreen": "#446746",
  "LightGreen": "#aad1b5",
  "DarkYellow": "#c6b343",
  "LightYellow": "#F1E8B0",
  "Cinza": "#C9CFCF",
  "Azul": "#87CEFA",
  "Rosa": "#FFB6C1",
  "Laranja": "#FFA500",
  "Vermelho": "#FF0000",
  "Verde": "#00FF00",
  "Amarelo": "#FFFF00",
  "Violeta": "#800080",
  "Preto": "#000000",
  "Roxo": "#800080",
};

const useStyles = () => {
  return "w-2.5 h-2.5 block rounded-full";
};

export default function VariantRing({ value, checked: _checked = false }: {
  value: string;
  checked?: boolean;
}) {
  const color = colors[value];
  const styles = useStyles();
  return <span style={{ backgroundColor: color ?? "black" }} class={styles} />;
}
