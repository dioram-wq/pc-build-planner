import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('starts on a matching AM5 CPU and motherboard', () => {
    render(<App />)

    expect(screen.getByLabelText('CPU')).toHaveProperty('value', 'cpu-7600')
    expect(screen.getByLabelText('Motherboard')).toHaveProperty(
      'value',
      'board-b650',
    )
    expect(screen.getByRole('status').textContent).toContain(
      'Compatible. Both parts use AM5.',
    )
  })

  it('reports a socket mismatch when the motherboard changes', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Motherboard'), {
      target: { value: 'board-b550' },
    })

    expect(screen.getByRole('status').textContent).toContain(
      'AMD Ryzen 5 7600 (AM5) does not fit MSI MAG B550 Tomahawk (AM4).',
    )
  })

  it('lists the compatibility checks that are not implemented yet', () => {
    render(<App />)

    expect(screen.getByText('RAM type vs motherboard')).toBeTruthy()
    expect(screen.getByText('Wattage vs estimated draw')).toBeTruthy()
    expect(
      screen.getByText('Cooler height and graphics card length'),
    ).toBeTruthy()
  })
})
