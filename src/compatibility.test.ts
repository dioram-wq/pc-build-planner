import { describe, expect, it } from 'vitest'
import {
  checkCpuSocket,
  checkMemoryType,
  checkPowerSupply,
  type Cpu,
  type CpuSocket,
  type Gpu,
  type Memory,
  type MemoryType,
  type Motherboard,
  type Psu,
} from './compatibility.ts'
import { cpus, gpus, memory, motherboards, psus } from './parts.ts'

function cpu(
  socket: CpuSocket,
  name = 'Sample CPU',
  tdpWatts = 65,
): Cpu {
  return { id: `cpu-${socket}`, name, socket, tdpWatts }
}

function board(
  socket: CpuSocket,
  name = 'Sample motherboard',
  memoryType: MemoryType = 'DDR5',
): Motherboard {
  return { id: `board-${socket}`, name, socket, memoryType }
}

function kit(memoryType: MemoryType, name = 'Sample memory'): Memory {
  return { id: `mem-${memoryType}`, name, memoryType }
}

function card(boardPowerWatts: number, name = 'Sample GPU'): Gpu {
  return { id: `gpu-${boardPowerWatts}`, name, boardPowerWatts }
}

function supply(wattage: number, name = 'Sample PSU'): Psu {
  return { id: `psu-${wattage}`, name, wattage }
}

describe('checkCpuSocket', () => {
  it('accepts a CPU that uses the motherboard socket', () => {
    const result = checkCpuSocket(
      cpu('AM5', 'AMD Ryzen 5 7600'),
      board('AM5', 'ASUS TUF Gaming B650-PLUS'),
    )

    expect(result).toEqual({ compatible: true, issues: [] })
  })

  it('rejects a socket mismatch and names both sockets', () => {
    const result = checkCpuSocket(
      cpu('AM5', 'AMD Ryzen 5 7600'),
      board('AM4', 'MSI MAG B550 Tomahawk'),
    )

    expect(result).toEqual({
      compatible: false,
      issues: [
        {
          code: 'socket-mismatch',
          message:
            'AMD Ryzen 5 7600 (AM5) does not fit MSI MAG B550 Tomahawk (AM4).',
        },
      ],
    })
  })

  it('treats each supported socket as its own match', () => {
    const sockets = ['AM4', 'AM5', 'LGA1700', 'LGA1851'] as const

    for (const socket of sockets) {
      expect(checkCpuSocket(cpu(socket), board(socket)).compatible).toBe(true)
      expect(
        checkCpuSocket(cpu(socket), board(socket === 'AM5' ? 'AM4' : 'AM5'))
          .compatible,
      ).toBe(false)
    }
  })
})

describe('checkMemoryType', () => {
  it('accepts memory that uses the motherboard type', () => {
    const result = checkMemoryType(
      kit('DDR5', 'Corsair Vengeance 32GB DDR5-6000'),
      board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5'),
    )

    expect(result).toEqual({ compatible: true, issues: [] })
  })

  it('rejects a memory type mismatch and names both types', () => {
    const result = checkMemoryType(
      kit('DDR4', 'Corsair Vengeance LPX 32GB DDR4-3600'),
      board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5'),
    )

    expect(result).toEqual({
      compatible: false,
      issues: [
        {
          code: 'memory-mismatch',
          message:
            'Corsair Vengeance LPX 32GB DDR4-3600 (DDR4) does not fit ASUS TUF Gaming B650-PLUS (DDR5).',
        },
      ],
    })
  })

  it('treats each supported memory type as its own match', () => {
    const types = ['DDR4', 'DDR5'] as const

    for (const memoryType of types) {
      expect(
        checkMemoryType(
          kit(memoryType),
          board('AM5', 'Sample motherboard', memoryType),
        ).compatible,
      ).toBe(true)
      expect(
        checkMemoryType(
          kit(memoryType),
          board(
            'AM5',
            'Sample motherboard',
            memoryType === 'DDR5' ? 'DDR4' : 'DDR5',
          ),
        ).compatible,
      ).toBe(false)
    }
  })
})

describe('checkPowerSupply', () => {
  const ryzen = () => cpu('AM5', 'AMD Ryzen 5 7600', 65)
  const rtx4060 = () => card(115, 'NVIDIA GeForce RTX 4060')

  it('adds CPU TDP, GPU board power, and a 100W platform allowance', () => {
    expect(
      checkPowerSupply(ryzen(), rtx4060(), supply(650)).estimatedDrawWatts,
    ).toBe(280)
    expect(
      checkPowerSupply(ryzen(), rtx4060(), supply(650)).recommendedWatts,
    ).toBe(350)

    expect(
      checkPowerSupply(
        cpu('LGA1700', 'Intel Core i5-14600K', 125),
        rtx4060(),
        supply(650),
      ).estimatedDrawWatts,
    ).toBe(340)

    const integrated = checkPowerSupply(ryzen(), null, supply(550))
    expect(integrated.estimatedDrawWatts).toBe(165)
    expect(integrated.recommendedWatts).toBe(207)
  })

  it('accepts a supply that meets the recommended headroom', () => {
    const result = checkPowerSupply(
      ryzen(),
      rtx4060(),
      supply(650, 'Corsair RM650x'),
    )

    expect(result).toEqual({
      status: 'ok',
      estimatedDrawWatts: 280,
      recommendedWatts: 350,
      issues: [],
    })
  })

  it('accepts a supply rated exactly at the recommended wattage', () => {
    const result = checkPowerSupply(ryzen(), rtx4060(), supply(350))

    expect(result.status).toBe('ok')
    expect(result.issues).toEqual([])
  })

  it('marks a supply tight when it covers the draw but misses the headroom', () => {
    const result = checkPowerSupply(
      ryzen(),
      card(450, 'NVIDIA GeForce RTX 4090'),
      supply(650, 'Corsair RM650x'),
    )

    expect(result).toEqual({
      status: 'tight',
      estimatedDrawWatts: 615,
      recommendedWatts: 769,
      issues: [
        {
          code: 'psu-tight',
          message:
            'Corsair RM650x (650W) covers the 615W estimate but is below the 769W recommendation.',
        },
      ],
    })
  })

  it('marks a supply tight when its rating equals the estimated draw', () => {
    const result = checkPowerSupply(ryzen(), rtx4060(), supply(280))

    expect(result.status).toBe('tight')
    expect(result.recommendedWatts).toBe(350)
    expect(result.issues.map((issue) => issue.code)).toEqual(['psu-tight'])
  })

  it('marks a supply insufficient when it is below the estimated draw', () => {
    const result = checkPowerSupply(
      ryzen(),
      card(450, 'NVIDIA GeForce RTX 4090'),
      supply(550, 'Corsair CX550'),
    )

    expect(result).toEqual({
      status: 'insufficient',
      estimatedDrawWatts: 615,
      recommendedWatts: 769,
      issues: [
        {
          code: 'psu-insufficient',
          message: 'Corsair CX550 (550W) is below the 615W estimated draw.',
        },
      ],
    })
  })

  it('marks a 0W rating insufficient', () => {
    const result = checkPowerSupply(ryzen(), null, supply(0, 'Unrated supply'))

    expect(result.status).toBe('insufficient')
    expect(result.issues).toEqual([
      {
        code: 'psu-insufficient',
        message: 'Unrated supply (0W) is below the 165W estimated draw.',
      },
    ])
  })

  it('reports a missing supply and still estimates the draw', () => {
    const result = checkPowerSupply(ryzen(), rtx4060(), null)

    expect(result).toEqual({
      status: 'missing',
      estimatedDrawWatts: 280,
      recommendedWatts: 350,
      issues: [
        {
          code: 'psu-missing',
          message:
            'Select a power supply to compare against the 280W estimated draw.',
        },
      ],
    })
  })
})

describe('sample catalog', () => {
  it('offers a motherboard for every CPU socket', () => {
    for (const part of cpus) {
      expect(motherboards.some((board) => board.socket === part.socket)).toBe(
        true,
      )
    }
  })

  it('includes DDR4 and DDR5 memory and a motherboard for each', () => {
    const types = ['DDR4', 'DDR5'] as const

    for (const memoryType of types) {
      expect(memory.some((part) => part.memoryType === memoryType)).toBe(true)
      expect(
        motherboards.some((part) => part.memoryType === memoryType),
      ).toBe(true)
    }
  })

  it('records a TDP on every CPU and wattage on every GPU and supply', () => {
    for (const part of cpus) {
      expect(part.tdpWatts).toBeGreaterThan(0)
    }
    expect(gpus.length).toBeGreaterThan(0)
    for (const part of gpus) {
      expect(part.boardPowerWatts).toBeGreaterThan(0)
    }
    expect(psus.length).toBeGreaterThan(0)
    for (const part of psus) {
      expect(part.wattage).toBeGreaterThan(0)
    }
  })

  it('includes a supply that is ok, tight, and insufficient for a high draw', () => {
    const part = cpus.find((item) => item.id === 'cpu-7600')
    const highDraw = gpus.find((item) => item.id === 'gpu-4090')
    if (!part || !highDraw) {
      throw new Error('expected the Ryzen 5 7600 and RTX 4090 in the catalog')
    }

    const statuses = new Set(
      psus.map((item) => checkPowerSupply(part, highDraw, item).status),
    )

    expect(statuses.has('ok')).toBe(true)
    expect(statuses.has('tight')).toBe(true)
    expect(statuses.has('insufficient')).toBe(true)
  })
})
