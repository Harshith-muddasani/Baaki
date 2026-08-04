/**
 * Deterministic avatar color per user - a small curated set of tasteful
 * gradient pairs (not a random/generated hue), so every avatar in the app
 * feels like it belongs to the same family instead of clashing.
 */
const PALETTE = [
  { from: '#4a3aa7', to: '#7c6fd1' }, // violet (brand)
  { from: '#2a78d6', to: '#5598e7' }, // blue
  { from: '#1baf7a', to: '#4bcf9e' }, // aqua/teal
  { from: '#eb6834', to: '#f4915f' }, // orange
  { from: '#e87ba4', to: '#f2a8c4' }, // magenta
  { from: '#0d366b', to: '#256abf' }, // deep blue
  { from: '#8a5a2a', to: '#c98d4f' }, // amber-brown
  { from: '#4a3aa7', to: '#e87ba4' }, // violet-magenta
] as const

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function avatarGradient(seed: string | number): string {
  const { from, to } = PALETTE[hashString(String(seed)) % PALETTE.length]
  return `linear-gradient(135deg, ${from}, ${to})`
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
