import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserAvatar } from '@/components/user-avatar'

describe('UserAvatar', () => {
  it('renders the initials of the given name', () => {
    render(<UserAvatar name="Ada Lovelace" seed={1} />)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('applies a background gradient derived from the seed', () => {
    render(<UserAvatar name="Bob" seed="bob-seed" />)
    const avatar = screen.getByText('BO')
    expect(avatar).toHaveStyle({ backgroundImage: expect.stringContaining('linear-gradient') })
  })

  it('renders the same gradient for the same seed across instances', () => {
    const { container: first } = render(<UserAvatar name="Carol" seed={7} />)
    const { container: second } = render(<UserAvatar name="Carol Duplicate" seed={7} />)
    const firstBg = (first.firstChild as HTMLElement).style.backgroundImage
    const secondBg = (second.firstChild as HTMLElement).style.backgroundImage
    expect(firstBg).toBe(secondBg)
  })
})
