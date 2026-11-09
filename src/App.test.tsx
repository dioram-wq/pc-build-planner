import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

const slotLabels = ['CPU', 'Motherboard', 'Memory', 'Power supply', 'Case']

describe('App', () => {
  it('lists the parts a build needs', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'PC Build Planner' }),
    ).toBeTruthy()

    for (const label of slotLabels) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })
})
