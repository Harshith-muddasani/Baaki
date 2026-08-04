// Single source of truth for animation timing. Any component reaching for a raw
// `duration`/`delay` number instead of these is drifting from the rest of the app.
export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const

export const EASE_OUT = [0.16, 1, 0.3, 1] as const

const STAGGER_STEP = 0.03
const STAGGER_CAP = 8 // beyond this, extra list items animate with no added delay

/** Fade-and-rise entrance for a single item in a list, staggered by index. */
export function fadeInUp(index = 0, distance = 8) {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: DURATION.base,
      delay: Math.min(index, STAGGER_CAP) * STAGGER_STEP,
      ease: EASE_OUT,
    },
  }
}

/** Fade-and-rise entrance for a standalone element (hero tiles, cards) with an explicit delay. */
export function fadeIn(delay = 0, distance = 8) {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION.base, delay, ease: EASE_OUT },
  }
}
