const descriptions: Record<string, string> = {
  emerald: 'Retrato de um macaco marrom com óculos redondos verdes, jaqueta verde e pingente de esmeralda.',
  sage: 'Retrato de um macaco de pelo cinza, chapéu verde e moletom roxo.',
  neon: 'Retrato de um macaco de pelo escuro, cabelo penteado, blazer claro e gola verde.',
  golden: 'Retrato de um macaco dourado com fones de ouvido verdes e jaqueta clara.',
}
export function describeArtwork(url: string, name?: string): string {
  const asset = url.match(/\/(emerald|sage|neon|golden)\.(?:webp|png)(?:[?#]|$)/)?.[1]
  const description = asset ? descriptions[asset] : 'Obra de arte digital da coleção.'
  return name ? `${name}. ${description}` : description
}
