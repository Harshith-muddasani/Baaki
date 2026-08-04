import { describe, expect, it } from 'vitest'
import { avatarGradient, initialsOf } from '@/lib/avatar-color'

describe('avatarGradient', () => {
  it('is deterministic for the same seed', () => {
    expect(avatarGradient('alice')).toBe(avatarGradient('alice'))
    expect(avatarGradient(42)).toBe(avatarGradient(42))
  })

  it('returns a valid CSS linear-gradient', () => {
    expect(avatarGradient('bob')).toMatch(/^linear-gradient\(135deg, #[0-9a-f]{6}, #[0-9a-f]{6}\)$/)
  })

  it('is not always the same gradient for different seeds', () => {
    // not a strict requirement of the hash, but the whole point of the
    // utility is to spread users across the palette
    const gradients = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(avatarGradient))
    expect(gradients.size).toBeGreaterThan(1)
  })
})

describe('initialsOf', () => {
  it('takes first + last initial for a full name', () => {
    expect(initialsOf('Ada Lovelace')).toBe('AL')
  })

  it('takes first two letters for a single-word name', () => {
    expect(initialsOf('Cher')).toBe('CH')
  })

  it('handles extra whitespace', () => {
    expect(initialsOf('  Grace   Hopper  ')).toBe('GH')
  })

  it('uses first and last of a multi-part name, not the middle', () => {
    expect(initialsOf('Mary Jane Watson')).toBe('MW')
  })
})
