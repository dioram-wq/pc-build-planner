import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('starts on a compatible AM5 build whose supply covers the draw', () => {
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
    expect(screen.getByLabelText('Graphics card')).toHaveProperty(
      'value',
      'gpu-4060',
    )
    expect(screen.getByLabelText('Power supply')).toHaveProperty(
      'value',
      'psu-550',
    )
    expect(screen.getByText('Compatible. Both parts use AM5.')).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use DDR5.')).toBeTruthy()
    expect(
      screen.getByText(
        'Estimated draw is 280W. Corsair CX550 (550W) meets the 350W recommendation.',
      ),
    ).toBeTruthy()
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

  it('marks the supply tight when a higher-draw card leaves too little headroom', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: 'gpu-4090' },
    })
    fireEvent.change(screen.getByLabelText('Power supply'), {
      target: { value: 'psu-650' },
    })

    expect(screen.getByText('Tight.')).toBeTruthy()
    expect(
      screen.getByText(
        'Corsair RM650x (650W) covers the 615W estimate but is below the 769W recommendation.',
      ),
    ).toBeTruthy()
  })

  it('marks the supply insufficient when it is below the estimated draw', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: 'gpu-4090' },
    })

    expect(screen.getByText('Insufficient.')).toBeTruthy()
    expect(
      screen.getByText(
        'Corsair CX550 (550W) is below the 615W estimated draw.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use AM5.')).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use DDR5.')).toBeTruthy()
  })

  it('asks for a power supply when none is selected', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Power supply'), {
      target: { value: '' },
    })

    expect(screen.getByText('No power supply selected.')).toBeTruthy()
    expect(
      screen.getByText(
        'Select a power supply to compare against the 280W estimated draw.',
      ),
    ).toBeTruthy()
  })

  it('drops graphics card power when the build uses integrated graphics', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: '' },
    })

    expect(
      screen.getByText(
        'Estimated draw is 165W. Corsair CX550 (550W) meets the 207W recommendation.',
      ),
    ).toBeTruthy()
  })

  it('lists the compatibility checks that are not implemented yet', () => {
    render(<App />)

    expect(screen.queryByText('RAM type vs motherboard')).toBeNull()
    expect(screen.queryByText('Wattage vs estimated draw')).toBeNull()
    expect(
      screen.getByText('Cooler height and graphics card length'),
    ).toBeTruthy()
  })
})
