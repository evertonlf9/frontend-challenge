/** Only local artwork has generated variants; uploaded/external images keep their URL. */
export function artworkImage(url: string, sizes: string) {
  const match = url.match(/^\/artwork\/(emerald|sage|neon|golden)\.webp$/)
  if (!match) return {}
  const base = `/artwork/${match[1]}`
  return { srcSet: `${base}-240.webp 240w, ${base}-480.webp 480w, ${base}-640.webp 640w, ${base}-800.webp 800w, ${base}.webp 960w`, sizes }
}
