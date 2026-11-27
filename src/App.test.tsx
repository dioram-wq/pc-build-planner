import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App, { PriceBreakdown } from './App.tsx'
import {
  cases,
  coolers,
  cpus,
  gpus,
  memory,
  motherboards,
  psus,
  storage,
} from './parts.ts'

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
    expect(screen.getByLabelText('Storage')).toHaveProperty(
      'value',
      'drive-sn770',
    )
    expect(screen.getByText('Compatible. Both parts use AM5.')).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use DDR5.')).toBeTruthy()
    expect(
      screen.getByText(
        'Compatible. Corsair Vengeance 32GB DDR5-6000 (2 modules, 32GB) fits ASUS TUF Gaming B650-PLUS (4 DIMM slots, 192GB).',
      ),
    ).toBeTruthy()
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
    expect(
      screen.getByText(
        'Compatible. WD Black SN770 1TB (M.2 NVMe) fits ASUS TUF Gaming B650-PLUS (3 M.2 slots).',
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Compatible. ASUS TUF Gaming B650-PLUS (ATX) fits Fractal Design North (ATX, Micro-ATX, Mini-ITX).',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('status', { name: 'Build status: All checks pass' }),
    ).toBeTruthy()
  })

  it('accepts a cooler that supports the processor socket', () => {
    render(<App />)

    expect(
      screen.getByText(
        'Compatible. Noctua NH-L12S supports AMD Ryzen 5 7600 (AM5).',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Noctua NH-L12S · AM4, AM5, LGA1700, LGA1851 · 70mm · $70',
      }).className,
    ).not.toContain('incompatible')
    expect(
      screen.getByRole('option', {
        name: 'Noctua NH-L9a · AM4, AM5 · 37mm · $45',
      }).className,
    ).not.toContain('incompatible')
  })

  it('flags a cooler that does not support the processor socket', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('CPU'), {
      target: { value: 'cpu-14600k' },
    })
    fireEvent.change(screen.getByLabelText('Motherboard'), {
      target: { value: 'board-z790' },
    })
    fireEvent.change(screen.getByLabelText('CPU cooler'), {
      target: { value: 'cooler-l9a' },
    })

    expect(screen.getByText('Cooler does not fit.')).toBeTruthy()
    expect(
      screen.getByText(
        'Noctua NH-L9a (AM4, AM5) does not support Intel Core i5-14600K (LGA1700).',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use LGA1700.')).toBeTruthy()
    expect(
      screen.getByRole('status', {
        name: 'Build status: 1 compatibility issue',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Noctua NH-L9a · AM4, AM5 · 37mm · $45 — incompatible: socket LGA1700',
      }),
    ).toHaveProperty('disabled', false)
    expect(
      screen.getByRole('option', {
        name: 'Intel Core i5-14600K · LGA1700 · $229 — incompatible: cooler supports AM4, AM5',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Noctua NH-L12S · AM4, AM5, LGA1700, LGA1851 · 70mm · $70',
      }).className,
    ).not.toContain('incompatible')

    fireEvent.change(screen.getByLabelText('CPU cooler'), {
      target: { value: '' },
    })

    expect(screen.getByText('No CPU cooler selected.')).toBeTruthy()
    expect(
      screen.getByText('Select a CPU cooler to check the sockets it supports.'),
    ).toBeTruthy()
    expect(
      screen.getByRole('status', { name: 'Build status: All checks pass' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Intel Core i5-14600K · LGA1700 · $229',
      }).className,
    ).not.toContain('incompatible')
  })

  it('flags an ATX motherboard that a Mini-ITX case cannot take', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Case'), {
      target: { value: 'case-nr200' },
    })

    expect(screen.getByText('Board does not fit.')).toBeTruthy()
    expect(
      screen.getByText(
        'ASUS TUF Gaming B650-PLUS (ATX) does not fit Cooler Master NR200P (Mini-ITX).',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('status', {
        name: 'Build status: 2 compatibility issues',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Cooler Master NR200P · Mini-ITX · SFX, SFX-L PSU · 330mm GPU · 155mm cooler · $110 — incompatible: ATX motherboard, ATX power supply',
      }),
    ).toHaveProperty('disabled', false)
    expect(
      screen.getByRole('option', {
        name: 'ASUS TUF Gaming B650-PLUS · AM5 · DDR5 · ATX · 4 DIMM slots · 192GB · 3 M.2 · 4 SATA · $179 — incompatible: case supports Mini-ITX',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Fractal Design North · ATX, Micro-ATX, Mini-ITX · ATX PSU · 355mm GPU · 170mm cooler · $140',
      }).className,
    ).not.toContain('incompatible')

    fireEvent.change(screen.getByLabelText('Case'), {
      target: { value: '' },
    })

    expect(
      screen.getByText('Select a case to check the motherboard form factor.'),
    ).toBeTruthy()
    expect(
      screen.getByRole('status', { name: 'Build status: All checks pass' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'ASUS TUF Gaming B650-PLUS · AM5 · DDR5 · ATX · 4 DIMM slots · 192GB · 3 M.2 · 4 SATA · $179',
      }).className,
    ).not.toContain('incompatible')
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
    expect(
      screen.getByRole('status', {
        name: 'Build status: 2 compatibility issues',
      }),
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
    expect(
      screen.getByRole('status', { name: 'Build status: 1 compatibility issue' }),
    ).toBeTruthy()
  })

  it('flags a kit with more modules than the motherboard has slots', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Motherboard'), {
      target: { value: 'board-b650m' },
    })
    fireEvent.change(screen.getByLabelText('Memory'), {
      target: { value: 'mem-ddr5-64' },
    })

    expect(screen.getByText('Too many modules.')).toBeTruthy()
    expect(
      screen.getByText(
        'Corsair Vengeance 64GB DDR5-5600 (4 modules) does not fit ASRock B650M-HDV/M.2 (2 DIMM slots).',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use AM5.')).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use DDR5.')).toBeTruthy()
    expect(
      screen.getByRole('status', {
        name: 'Build status: 1 compatibility issue',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Corsair Vengeance 64GB DDR5-5600 · DDR5 · 4 modules · 64GB · $169 — incompatible: 2 DIMM slots',
      }),
    ).toHaveProperty('disabled', false)
    expect(
      screen.getByRole('option', {
        name: 'ASRock B650M-HDV/M.2 · AM5 · DDR5 · Micro-ATX · 2 DIMM slots · 96GB · 1 M.2 · 4 SATA · $99 — incompatible: 4 modules',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Corsair Vengeance 32GB DDR5-6000 · DDR5 · 2 modules · 32GB · $109',
      }).className,
    ).not.toContain('incompatible')

    fireEvent.change(screen.getByLabelText('Motherboard'), {
      target: { value: 'board-b650' },
    })

    expect(
      screen.getByText(
        'Compatible. Corsair Vengeance 64GB DDR5-5600 (4 modules, 64GB) fits ASUS TUF Gaming B650-PLUS (4 DIMM slots, 192GB).',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('status', { name: 'Build status: All checks pass' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Corsair Vengeance 64GB DDR5-5600 · DDR5 · 4 modules · 64GB · $169',
      }).className,
    ).not.toContain('incompatible')
  })

  it('flags a kit over the motherboard memory maximum', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Motherboard'), {
      target: { value: 'board-b650m' },
    })
    fireEvent.change(screen.getByLabelText('Memory'), {
      target: { value: 'mem-ddr5-128' },
    })

    expect(screen.getByText('Over the memory limit.')).toBeTruthy()
    expect(
      screen.getByText(
        'Kingston Fury Beast 128GB DDR5-5600 (128GB) is more than ASRock B650M-HDV/M.2 supports (96GB).',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use DDR5.')).toBeTruthy()
    expect(
      screen.getByRole('status', {
        name: 'Build status: 1 compatibility issue',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Kingston Fury Beast 128GB DDR5-5600 · DDR5 · 2 modules · 128GB · $429 — incompatible: 96GB memory limit',
      }),
    ).toHaveProperty('disabled', false)
    expect(
      screen.getByRole('option', {
        name: 'ASRock B650M-HDV/M.2 · AM5 · DDR5 · Micro-ATX · 2 DIMM slots · 96GB · 1 M.2 · 4 SATA · $99 — incompatible: 128GB memory',
      }),
    ).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Motherboard'), {
      target: { value: 'board-b650' },
    })

    expect(
      screen.getByText(
        'Compatible. Kingston Fury Beast 128GB DDR5-5600 (2 modules, 128GB) fits ASUS TUF Gaming B650-PLUS (4 DIMM slots, 192GB).',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('status', { name: 'Build status: All checks pass' }),
    ).toBeTruthy()
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
    expect(
      screen.getByRole('status', { name: 'Build status: All checks pass' }),
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

  it('accepts a graphics card whose 8-pin connector the supply provides', () => {
    render(<App />)

    expect(
      screen.getByText(
        'Compatible. NVIDIA GeForce RTX 4060 (1x 8-pin) fits Corsair CX550 (2x 8-pin).',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'NVIDIA GeForce RTX 4060 · 115W · 1x 8-pin · 240mm · $299',
      }).className,
    ).not.toContain('incompatible')
    expect(
      screen.getByRole('option', {
        name: 'Corsair CX550 · 550W · ATX · 2x 8-pin · $65',
      }).className,
    ).not.toContain('incompatible')
  })

  it('flags a graphics card the power supply cannot plug in', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: 'gpu-4090' },
    })

    expect(screen.getByText('Not enough power connectors.')).toBeTruthy()
    expect(
      screen.getByText(
        'NVIDIA GeForce RTX 4090 (3x 8-pin or 1x 12VHPWR) does not fit Corsair CX550 (2x 8-pin).',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('status', {
        name: 'Build status: 2 compatibility issues',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'NVIDIA GeForce RTX 4090 · 450W · 3x 8-pin or 1x 12VHPWR · 304mm · $1,599 — incompatible: supply has 2x 8-pin',
      }),
    ).toHaveProperty('disabled', false)
    expect(
      screen.getByRole('option', {
        name: 'Corsair CX550 · 550W · ATX · 2x 8-pin · $65 — incompatible: below 615W, GPU needs 3x 8-pin or 1x 12VHPWR',
      }),
    ).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Power supply'), {
      target: { value: 'psu-650' },
    })

    expect(
      screen.getByText(
        'Compatible. NVIDIA GeForce RTX 4090 (3x 8-pin or 1x 12VHPWR) fits Corsair RM650x (4x 8-pin).',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Tight.')).toBeTruthy()
    expect(
      screen.getByRole('status', { name: 'Build status: All checks pass' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'NVIDIA GeForce RTX 4090 · 450W · 3x 8-pin or 1x 12VHPWR · 304mm · $1,599',
      }).className,
    ).not.toContain('incompatible')

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: '' },
    })

    expect(screen.getByText('No graphics card selected.')).toBeTruthy()
    expect(
      screen.getByText('Select a graphics card to check its power connectors.'),
    ).toBeTruthy()
    expect(
      screen.getByRole('status', { name: 'Build status: All checks pass' }),
    ).toBeTruthy()
  })

  it('asks for a supply before checking graphics card power connectors', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Power supply'), {
      target: { value: '' },
    })

    expect(
      screen.getByText('No power supply for the graphics card.'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Select a power supply to check the graphics card power connectors.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('status', { name: 'Build status: All checks pass' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'NVIDIA GeForce RTX 4060 · 115W · 1x 8-pin · 240mm · $299',
      }).className,
    ).not.toContain('incompatible')
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
    expect(
      screen.getByRole('status', { name: 'Build status: All checks pass' }),
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

    expect(screen.getAllByText('No case selected.').length).toBe(2)
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
    expect(screen.getByText('Total $1,131')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: 'gpu-4090' },
    })

    expect(screen.getByText('Total $2,431')).toBeTruthy()

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

    expect(screen.getByText('Total $557')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Storage'), {
      target: { value: '' },
    })

    expect(screen.getByText('Total $487')).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use AM5.')).toBeTruthy()
  })

  it('lists each selected part under the running total', () => {
    render(<App />)

    const list = screen.getByRole('list', { name: 'Price breakdown' })
    expect(within(list).getAllByRole('listitem').length).toBe(8)
    expect(within(list).getByText('AMD Ryzen 5 7600')).toBeTruthy()
    expect(within(list).getByText('$199')).toBeTruthy()
    expect(within(list).getByText('NVIDIA GeForce RTX 4060')).toBeTruthy()
    expect(within(list).getByText('$299')).toBeTruthy()
    expect(screen.getByText('Total $1,131')).toBeTruthy()

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
    fireEvent.change(screen.getByLabelText('Storage'), {
      target: { value: '' },
    })

    const partial = screen.getByRole('list', { name: 'Price breakdown' })
    expect(within(partial).getAllByRole('listitem').length).toBe(3)
    expect(within(partial).getByText('AMD Ryzen 5 7600')).toBeTruthy()
    expect(within(partial).getByText('ASUS TUF Gaming B650-PLUS')).toBeTruthy()
    expect(
      within(partial).getByText('Corsair Vengeance 32GB DDR5-6000'),
    ).toBeTruthy()
    expect(within(partial).queryByText('NVIDIA GeForce RTX 4060')).toBeNull()
    expect(within(partial).queryByText('Noctua NH-L12S')).toBeNull()
    expect(within(partial).queryByText('Fractal Design North')).toBeNull()
    expect(within(partial).queryByText('Corsair CX550')).toBeNull()
    expect(within(partial).queryByText('WD Black SN770 1TB')).toBeNull()
    expect(screen.getByText('Total $487')).toBeTruthy()
  })

  it('accepts a SATA drive when the motherboard has SATA ports', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Storage'), {
      target: { value: 'drive-870evo' },
    })

    expect(
      screen.getByText(
        'Compatible. Samsung 870 EVO 1TB (SATA) fits ASUS TUF Gaming B650-PLUS (4 SATA ports).',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Total $1,151')).toBeTruthy()
  })

  it('uses the selected motherboard slot count in the storage check', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Motherboard'), {
      target: { value: 'board-b550' },
    })

    expect(
      screen.getByText(
        'Compatible. WD Black SN770 1TB (M.2 NVMe) fits MSI MAG B550 Tomahawk (2 M.2 slots).',
      ),
    ).toBeTruthy()
  })

  it('asks for storage when no drive is selected', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Storage'), {
      target: { value: '' },
    })

    expect(screen.getByText('No storage selected.')).toBeTruthy()
    expect(
      screen.getByText(
        'Select a drive to check its interface against the motherboard.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use AM5.')).toBeTruthy()
  })

  it('writes the selected parts into the query string', () => {
    render(<App />)

    expect(window.location.search).toContain('c=cpu-7600')
    expect(window.location.search).toContain('g=gpu-4060')
    expect(window.location.hash).toBe('')

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('Storage'), {
      target: { value: 'drive-870evo' },
    })

    expect(window.location.search).not.toContain('g=')
    expect(window.location.search).toContain('d=drive-870evo')
    expect(window.location.search).toContain('c=cpu-7600')
  })

  it('restores a shared build from the query string', () => {
    window.history.replaceState(
      null,
      '',
      '/?c=cpu-5800x&b=board-b550&m=mem-ddr4-3200&g=gpu-7800xt&h=cooler-nhd15&e=case-lancool&p=psu-850&d=drive-870evo',
    )

    render(<App />)

    expect(screen.getByLabelText('CPU')).toHaveProperty('value', 'cpu-5800x')
    expect(screen.getByLabelText('Motherboard')).toHaveProperty(
      'value',
      'board-b550',
    )
    expect(screen.getByLabelText('Memory')).toHaveProperty(
      'value',
      'mem-ddr4-3200',
    )
    expect(screen.getByLabelText('Graphics card')).toHaveProperty(
      'value',
      'gpu-7800xt',
    )
    expect(screen.getByLabelText('CPU cooler')).toHaveProperty(
      'value',
      'cooler-nhd15',
    )
    expect(screen.getByLabelText('Case')).toHaveProperty(
      'value',
      'case-lancool',
    )
    expect(screen.getByLabelText('Power supply')).toHaveProperty(
      'value',
      'psu-850',
    )
    expect(screen.getByLabelText('Storage')).toHaveProperty(
      'value',
      'drive-870evo',
    )
    expect(screen.getByText('Compatible. Both parts use AM4.')).toBeTruthy()
    expect(screen.getByText('Compatible. Both parts use DDR4.')).toBeTruthy()
  })

  it('restores a shared build from the hash and canonicalizes it to the query', () => {
    window.history.replaceState(
      null,
      '',
      '/#c=cpu-265k&b=board-z890&m=mem-ddr5-5600',
    )

    render(<App />)

    expect(screen.getByLabelText('CPU')).toHaveProperty('value', 'cpu-265k')
    expect(screen.getByLabelText('Motherboard')).toHaveProperty(
      'value',
      'board-z890',
    )
    expect(screen.getByLabelText('Memory')).toHaveProperty(
      'value',
      'mem-ddr5-5600',
    )
    expect(screen.getByLabelText('Graphics card')).toHaveProperty('value', '')
    expect(screen.getByLabelText('CPU cooler')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Case')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Power supply')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Storage')).toHaveProperty('value', '')
    expect(screen.getByText('Compatible. Both parts use LGA1851.')).toBeTruthy()
    expect(window.location.hash).toBe('')
    expect(window.location.search).toContain('c=cpu-265k')
    expect(window.location.search).toContain('b=board-z890')
    expect(window.location.search).not.toContain('g=')
  })

  it('ignores unknown part ids in a shared link', () => {
    window.history.replaceState(
      null,
      '',
      '/?c=cpu-nope&b=board-z790&g=not-a-gpu&d=drive-mx500&x=case-north',
    )

    render(<App />)

    expect(screen.getByLabelText('CPU')).toHaveProperty('value', 'cpu-7600')
    expect(screen.getByLabelText('Motherboard')).toHaveProperty(
      'value',
      'board-z790',
    )
    expect(screen.getByLabelText('Graphics card')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Case')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Storage')).toHaveProperty(
      'value',
      'drive-mx500',
    )
  })

  it('keeps the starter build when the shared link is malformed', () => {
    window.history.replaceState(null, '', '/?%%%')

    render(<App />)

    expect(screen.getByLabelText('CPU')).toHaveProperty('value', 'cpu-7600')
    expect(screen.getByLabelText('Graphics card')).toHaveProperty(
      'value',
      'gpu-4060',
    )
    expect(screen.getByText('Total $1,131')).toBeTruthy()
  })

  it('round-trips a changed build through the address bar', () => {
    const view = render(<App />)

    fireEvent.change(screen.getByLabelText('CPU'), {
      target: { value: 'cpu-265k' },
    })
    fireEvent.change(screen.getByLabelText('Motherboard'), {
      target: { value: 'board-z890' },
    })
    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: '' },
    })

    const search = window.location.search
    view.unmount()
    window.history.replaceState(null, '', `/${search}`)
    render(<App />)

    expect(screen.getByLabelText('CPU')).toHaveProperty('value', 'cpu-265k')
    expect(screen.getByLabelText('Motherboard')).toHaveProperty(
      'value',
      'board-z890',
    )
    expect(screen.getByLabelText('Graphics card')).toHaveProperty('value', '')
    expect(screen.getByText('Compatible. Both parts use LGA1851.')).toBeTruthy()
  })

  it('copies the current build link', async () => {
    const writeText = vi.fn<(href: string) => Promise<void>>(() =>
      Promise.resolve(),
    )
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    try {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))

      expect(await screen.findByText('Link copied')).toBeTruthy()
      expect(writeText).toHaveBeenCalledOnce()
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('c=cpu-7600'),
      )
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('d=drive-sn770'),
      )
      expect(window.location.search).toContain('c=cpu-7600')
    } finally {
      if (original) {
        Object.defineProperty(navigator, 'clipboard', original)
      } else {
        Reflect.deleteProperty(navigator, 'clipboard')
      }
    }
  })

  it('marks conflicting options in the lists and still lets them be selected', () => {
    render(<App />)

    const compatibleCpu = screen.getByRole('option', {
      name: 'AMD Ryzen 5 7600 · AM5 · $199',
    })
    const am4Cpu = screen.getByRole('option', {
      name: 'AMD Ryzen 7 5800X · AM4 · $189 — incompatible: socket AM5',
    })
    const ddr4 = screen.getByRole('option', {
      name: 'Corsair Vengeance LPX 32GB DDR4-3600 · DDR4 · 2 modules · 32GB · $69 — incompatible: memory DDR5',
    })
    const b550 = screen.getByRole('option', {
      name: 'MSI MAG B550 Tomahawk · AM4 · DDR4 · ATX · 4 DIMM slots · 128GB · 2 M.2 · 6 SATA · $149 — incompatible: socket AM5, memory DDR5',
    })

    expect(compatibleCpu.className).not.toContain('incompatible')
    expect(am4Cpu.className).toContain('incompatible')
    expect(am4Cpu).toHaveProperty('disabled', false)
    expect(ddr4).toHaveProperty('disabled', false)
    expect(b550).toHaveProperty('disabled', false)
    expect(screen.getByRole('option', { name: 'Integrated graphics' })).toHaveProperty(
      'disabled',
      false,
    )
    expect(screen.getByRole('option', { name: 'No storage' })).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'WD Black SN770 1TB · M.2 NVMe · $70',
      }).className,
    ).not.toContain('incompatible')

    fireEvent.change(screen.getByLabelText('CPU'), {
      target: { value: 'cpu-5800x' },
    })

    expect(screen.getByLabelText('CPU')).toHaveProperty('value', 'cpu-5800x')
    expect(
      screen.getByText(
        'AMD Ryzen 7 5800X (AM4) does not fit ASUS TUF Gaming B650-PLUS (AM5).',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'ASUS TUF Gaming B650-PLUS · AM5 · DDR5 · ATX · 4 DIMM slots · 192GB · 3 M.2 · 4 SATA · $179 — incompatible: socket AM4',
      }),
    ).toBeTruthy()
  })

  it('marks a card and cooler that miss the case, and clears those marks with no case', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Power supply'), {
      target: { value: 'psu-650' },
    })

    expect(
      screen.getByRole('option', {
        name: 'NVIDIA GeForce RTX 4090 · 450W · 3x 8-pin or 1x 12VHPWR · 304mm · $1,599',
      }).className,
    ).not.toContain('incompatible')

    fireEvent.change(screen.getByLabelText('Case'), {
      target: { value: 'case-sg13' },
    })

    expect(
      screen.getByRole('option', {
        name: 'NVIDIA GeForce RTX 4060 · 115W · 1x 8-pin · 240mm · $299',
      }).className,
    ).not.toContain('incompatible')
    expect(
      screen.getByRole('option', {
        name: 'NVIDIA GeForce RTX 4090 · 450W · 3x 8-pin or 1x 12VHPWR · 304mm · $1,599 — incompatible: 270mm GPU limit',
      }),
    ).toHaveProperty('disabled', false)
    expect(
      screen.getByRole('option', {
        name: 'Noctua NH-L12S · AM4, AM5, LGA1700, LGA1851 · 70mm · $70 — incompatible: 61mm cooler limit',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('option', {
        name: 'Noctua NH-L9a · AM4, AM5 · 37mm · $45',
      }).className,
    ).not.toContain('incompatible')
    expect(
      screen.getByRole('option', {
        name: 'SilverStone SUGO SG13 · Mini-ITX · ATX, SFX PSU · 270mm GPU · 61mm cooler · $70 — incompatible: ATX motherboard, 70mm cooler',
      }),
    ).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: 'gpu-4090' },
    })
    fireEvent.change(screen.getByLabelText('CPU cooler'), {
      target: { value: 'cooler-nhd15' },
    })

    expect(screen.getByLabelText('Graphics card')).toHaveProperty(
      'value',
      'gpu-4090',
    )
    expect(screen.getByLabelText('CPU cooler')).toHaveProperty(
      'value',
      'cooler-nhd15',
    )
    expect(
      screen.getByRole('option', {
        name: 'SilverStone SUGO SG13 · Mini-ITX · ATX, SFX PSU · 270mm GPU · 61mm cooler · $70 — incompatible: ATX motherboard, 304mm GPU, 165mm cooler',
      }),
    ).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Case'), {
      target: { value: '' },
    })

    expect(
      screen.getByRole('option', {
        name: 'NVIDIA GeForce RTX 4090 · 450W · 3x 8-pin or 1x 12VHPWR · 304mm · $1,599',
      }).className,
    ).not.toContain('incompatible')
    expect(
      screen.getByRole('option', {
        name: 'Noctua NH-D15 · AM4, AM5, LGA1700, LGA1851 · 165mm · $110',
      }).className,
    ).not.toContain('incompatible')
  })

  it('marks a supply below the estimated draw and leaves a tight supply unmarked', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Graphics card'), {
      target: { value: 'gpu-4090' },
    })

    const insufficient = screen.getByRole('option', {
      name: 'Corsair CX550 · 550W · ATX · 2x 8-pin · $65 — incompatible: below 615W, GPU needs 3x 8-pin or 1x 12VHPWR',
    })
    const tight = screen.getByRole('option', {
      name: 'Corsair RM650x · 650W · ATX · 4x 8-pin · $110',
    })

    expect(insufficient.className).toContain('incompatible')
    expect(insufficient).toHaveProperty('disabled', false)
    expect(tight.className).not.toContain('incompatible')

    fireEvent.change(screen.getByLabelText('Power supply'), {
      target: { value: 'psu-1000' },
    })
    fireEvent.change(screen.getByLabelText('Power supply'), {
      target: { value: 'psu-550' },
    })

    expect(screen.getByLabelText('Power supply')).toHaveProperty(
      'value',
      'psu-550',
    )
    expect(screen.getByText('Insufficient.')).toBeTruthy()
  })

  it('no longer lists case clearance as a later check', () => {
    render(<App />)

    expect(screen.queryByRole('heading', { name: 'Still to check' })).toBeNull()
    expect(
      screen.queryByText('Cooler height and graphics card length'),
    ).toBeNull()
  })
})

describe('PriceBreakdown', () => {
  it('shows only the total when nothing is selected', () => {
    render(
      <PriceBreakdown
        slots={[
          { category: 'CPU', part: null },
          { category: 'Graphics card', part: null },
          { category: 'Storage' },
        ]}
      />,
    )

    expect(screen.getByText('Total $0')).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Price breakdown' })).toBeNull()
  })

  it('lists the selected parts of a partial build', () => {
    render(
      <PriceBreakdown
        slots={[
          {
            category: 'CPU',
            part: { name: 'AMD Ryzen 5 7600', priceUsd: 199 },
          },
          {
            category: 'Motherboard',
            part: { name: 'ASUS TUF Gaming B650-PLUS', priceUsd: 179 },
          },
          { category: 'Graphics card', part: null },
          {
            category: 'Storage',
            part: { name: 'WD Black SN770 1TB', priceUsd: 70 },
          },
        ]}
      />,
    )

    const list = screen.getByRole('list', { name: 'Price breakdown' })
    expect(within(list).getAllByRole('listitem').length).toBe(3)
    expect(within(list).getByText('AMD Ryzen 5 7600')).toBeTruthy()
    expect(within(list).getByText('$199')).toBeTruthy()
    expect(within(list).getByText('ASUS TUF Gaming B650-PLUS')).toBeTruthy()
    expect(within(list).getByText('$179')).toBeTruthy()
    expect(within(list).getByText('WD Black SN770 1TB')).toBeTruthy()
    expect(within(list).getByText('$70')).toBeTruthy()
    expect(screen.getByText('Total $448')).toBeTruthy()
  })

  it('lists every part in a full build', () => {
    render(
      <PriceBreakdown
        slots={[
          { category: 'CPU', part: cpus[0] },
          { category: 'Motherboard', part: motherboards[0] },
          { category: 'Memory', part: memory[0] },
          { category: 'Graphics card', part: gpus[0] },
          { category: 'CPU cooler', part: coolers[0] },
          { category: 'Case', part: cases[0] },
          { category: 'Power supply', part: psus[0] },
          { category: 'Storage', part: storage[0] },
        ]}
      />,
    )

    const list = screen.getByRole('list', { name: 'Price breakdown' })
    expect(within(list).getAllByRole('listitem').length).toBe(8)
    expect(within(list).getByText('AMD Ryzen 5 7600')).toBeTruthy()
    expect(within(list).getByText('ASUS TUF Gaming B650-PLUS')).toBeTruthy()
    expect(within(list).getByText('Corsair Vengeance 32GB DDR5-6000')).toBeTruthy()
    expect(within(list).getByText('NVIDIA GeForce RTX 4060')).toBeTruthy()
    expect(within(list).getByText('Noctua NH-L12S')).toBeTruthy()
    expect(within(list).getByText('Fractal Design North')).toBeTruthy()
    expect(within(list).getByText('Corsair CX550')).toBeTruthy()
    expect(within(list).getByText('WD Black SN770 1TB')).toBeTruthy()
    expect(screen.getByText('Total $1,131')).toBeTruthy()
  })

  it('shows an em dash for a part with no price and leaves it out of the total', () => {
    render(
      <PriceBreakdown
        slots={[
          {
            category: 'CPU',
            part: { name: 'AMD Ryzen 5 7600', priceUsd: 199 },
          },
          { category: 'Graphics card', part: { name: 'Unlisted GPU' } },
        ]}
      />,
    )

    const list = screen.getByRole('list', { name: 'Price breakdown' })
    expect(within(list).getByText('AMD Ryzen 5 7600')).toBeTruthy()
    expect(within(list).getByText('$199')).toBeTruthy()
    expect(within(list).getByText('Unlisted GPU')).toBeTruthy()
    expect(within(list).getByText('—')).toBeTruthy()
    expect(within(list).queryByText('$0')).toBeNull()
    expect(screen.getByText('Total $199')).toBeTruthy()
  })
})
