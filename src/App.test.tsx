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
    expect(screen.getByLabelText('CPU cooler')).toHaveProperty(
      'value',
      'cooler-l12s',
    )
    expect(screen.getByLabelText('Case')).toHaveProperty('value', 'case-north')
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
    expect(
      screen.getByText(
        'NVIDIA GeForce RTX 4060 (240mm) fits Fractal Design North (355mm). Noctua NH-L12S (70mm) fits the 170mm cooler limit.',
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

  it('marks the graphics card too long when it exceeds the case', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Case'), {
      target: { value: 'case-sg13' },
    })
    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: 'gpu-4090' },
    })
    fireEvent.change(screen.getByLabelText('CPU cooler'), {
      target: { value: 'cooler-l9a' },
    })

    expect(screen.getByText('Too long.')).toBeTruthy()
    expect(
      screen.getByText(
        'NVIDIA GeForce RTX 4090 (304mm) is longer than SilverStone SUGO SG13 allows (270mm).',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Too tall.')).toBeNull()
  })

  it('marks the cooler too tall when it exceeds the case', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Case'), {
      target: { value: 'case-nr200' },
    })
    fireEvent.change(screen.getByLabelText('CPU cooler'), {
      target: { value: 'cooler-nhd15' },
    })

    expect(screen.getByText('Too tall.')).toBeTruthy()
    expect(
      screen.getByText(
        'Noctua NH-D15 (165mm) is taller than Cooler Master NR200P allows (155mm).',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Too long.')).toBeNull()
    expect(screen.getByText('Compatible. Both parts use AM5.')).toBeTruthy()
  })

  it('reports both clearance problems when the card and cooler miss the case', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Case'), {
      target: { value: 'case-sg13' },
    })
    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: 'gpu-4090' },
    })
    fireEvent.change(screen.getByLabelText('CPU cooler'), {
      target: { value: 'cooler-nhd15' },
    })

    expect(screen.getByText('Does not fit.')).toBeTruthy()
    expect(
      screen.getByText(
        'NVIDIA GeForce RTX 4090 (304mm) is longer than SilverStone SUGO SG13 allows (270mm).',
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Noctua NH-D15 (165mm) is taller than SilverStone SUGO SG13 allows (61mm).',
      ),
    ).toBeTruthy()
  })

  it('skips the cooler check when no cooler is selected', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('CPU cooler'), {
      target: { value: '' },
    })

    expect(
      screen.getByText(
        'NVIDIA GeForce RTX 4060 (240mm) fits Fractal Design North (355mm).',
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/cooler limit/)).toBeNull()
  })

  it('skips the graphics card check when the build uses integrated graphics', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: '' },
    })

    expect(
      screen.getByText('Noctua NH-L12S (70mm) fits the 170mm cooler limit.'),
    ).toBeTruthy()
    expect(
      screen.queryByText(
        'NVIDIA GeForce RTX 4060 (240mm) fits Fractal Design North (355mm).',
      ),
    ).toBeNull()
  })

  it('asks for a case when none is selected', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Case'), {
      target: { value: '' },
    })

    expect(screen.getByText('No case selected.')).toBeTruthy()
    expect(
      screen.getByText(
        'Select a case to check graphics card length and cooler height.',
      ),
    ).toBeTruthy()
  })

  it('asks for a card or cooler when the case has nothing to compare', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('CPU cooler'), {
      target: { value: '' },
    })

    expect(screen.getByText('Nothing selected to check.')).toBeTruthy()
    expect(
      screen.getByText(
        'Select a graphics card or a CPU cooler to check clearance in Fractal Design North.',
      ),
    ).toBeTruthy()
  })

  it('shows a running total of the selected sample prices', () => {
    render(<App />)

    expect(
      screen.getByRole('option', {
        name: 'AMD Ryzen 5 7600 · AM5 · $199',
      }),
    ).toBeTruthy()
    expect(screen.getByText('Total $1,061')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: 'gpu-4090' },
    })

    expect(screen.getByText('Total $2,361')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('CPU cooler'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('Case'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('Power supply'), {
      target: { value: '' },
    })

    expect(screen.getByText('Total $487')).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use AM5.')).toBeTruthy()
  })

  it('no longer lists case clearance as a later check', () => {
    render(<App />)

    expect(screen.queryByRole('heading', { name: 'Still to check' })).toBeNull()
    expect(
      screen.queryByText('Cooler height and graphics card length'),
    ).toBeNull()
  })
})
