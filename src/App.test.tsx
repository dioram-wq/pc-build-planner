import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('starts on a matching AM5 CPU, motherboard, and DDR5 memory', () => {
    render(<App />)

    expect(screen.getByLabelText('CPU')).toHaveProperty('value', 'cpu-7600')
    expect(screen.getByLabelText('Motherboard')).toHaveProperty(
      'value',
      'board-b650',
    )
    expect(screen.getByLabelText('Memory')).toHaveProperty(
      'value',
      'mem-ddr5-6000',
    )
    expect(screen.getByText('Compatible. Both parts use AM5.')).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use DDR5.')).toBeTruthy()
  })

  it('reports a socket mismatch when the motherboard changes', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Motherboard'), {
      target: { value: 'board-b550' },
    })

    expect(
      screen.getByText(
        'AMD Ryzen 5 7600 (AM5) does not fit MSI MAG B550 Tomahawk (AM4).',
      ),
    ).toBeTruthy()
  })

  it('reports a memory type mismatch when the kit changes', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Memory'), {
      target: { value: 'mem-ddr4-3600' },
    })

    expect(
      screen.getByText(
        'Corsair Vengeance LPX 32GB DDR4-3600 (DDR4) does not fit ASUS TUF Gaming B650-PLUS (DDR5).',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use AM5.')).toBeTruthy()
  })

  it('accepts DDR4 memory on the B550 motherboard', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Motherboard'), {
      target: { value: 'board-b550' },
    })
    fireEvent.change(screen.getByLabelText('Memory'), {
      target: { value: 'mem-ddr4-3200' },
    })

    expect(screen.getByText('Compatible. Both parts use DDR4.')).toBeTruthy()
    expect(
      screen.getByText(
        'AMD Ryzen 5 7600 (AM5) does not fit MSI MAG B550 Tomahawk (AM4).',
      ),
    ).toBeTruthy()
  })

  it('lists the compatibility checks that are not implemented yet', () => {
    render(<App />)

    expect(screen.queryByText('RAM type vs motherboard')).toBeNull()
    expect(screen.getByText('Wattage vs estimated draw')).toBeTruthy()
    expect(
      screen.getByText('Cooler height and graphics card length'),
    ).toBeTruthy()
  })
})
