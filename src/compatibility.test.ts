import { describe, expect, it } from 'vitest'
import {
  checkCaseClearance,
  checkCpuSocket,
  checkMemoryCapacity,
  checkMemoryType,
  checkMotherboardFormFactor,
  checkPowerSupply,
  checkStorageInterface,
  type Case,
  type Cpu,
  type CpuCooler,
  type BoardFormFactor,
  type CpuSocket,
  type Gpu,
  type Memory,
  type MemoryType,
  type Motherboard,
  type Psu,
  type StorageDrive,
  type StorageInterface,
} from './compatibility.ts'
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
  m2Slots = 2,
  sataPorts = 4,
  formFactor: BoardFormFactor = 'ATX',
  dimmSlots = 4,
  maxMemoryGb = 192,
): Motherboard {
  return {
    id: `board-${socket}`,
    name,
    socket,
    memoryType,
    m2Slots,
    sataPorts,
    formFactor,
    dimmSlots,
    maxMemoryGb,
  }
}

function kit(
  memoryType: MemoryType,
  name = 'Sample memory',
  modules = 2,
  capacityGb = 32,
): Memory {
  return { id: `mem-${memoryType}`, name, memoryType, modules, capacityGb }
}

function card(
  boardPowerWatts: number,
  name = 'Sample GPU',
  lengthMm = 240,
): Gpu {
  return { id: `gpu-${boardPowerWatts}`, name, boardPowerWatts, lengthMm }
}

function tower(
  heightMm: number,
  name = 'Sample cooler',
  sockets: readonly CpuSocket[] = ['AM4', 'AM5', 'LGA1700', 'LGA1851'],
): CpuCooler {
  return { id: `cooler-${heightMm}`, name, heightMm, sockets }
}

function chassis(
  maxGpuLengthMm: number,
  maxCoolerHeightMm: number,
  name = 'Sample case',
  supportedFormFactors: readonly BoardFormFactor[] = [
    'ATX',
    'Micro-ATX',
    'Mini-ITX',
  ],
): Case {
  return {
    id: `case-${maxGpuLengthMm}-${maxCoolerHeightMm}`,
    name,
    maxGpuLengthMm,
    maxCoolerHeightMm,
    supportedFormFactors,
  }
}

function supply(wattage: number, name = 'Sample PSU'): Psu {
  return { id: `psu-${wattage}`, name, wattage }
}

function drive(
  storageInterface: StorageInterface,
  name = 'Sample drive',
): StorageDrive {
  return { id: 'drive-sample', name, interface: storageInterface }
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

describe('checkMemoryCapacity', () => {
  const vengeance = () =>
    kit('DDR5', 'Corsair Vengeance 32GB DDR5-6000', 2, 32)
  const b650 = () =>
    board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 3, 4, 'ATX', 4, 192)
  const compact = () =>
    board('AM5', 'ASRock B650M-HDV/M.2', 'DDR5', 1, 4, 'Micro-ATX', 2, 96)

  it('accepts a kit that fits the slots and the maximum', () => {
    expect(checkMemoryCapacity(vengeance(), b650())).toEqual({
      status: 'ok',
      moduleCount: 'ok',
      capacity: 'ok',
      issues: [],
    })
  })

  it('accepts a kit that matches the slot count and the maximum exactly', () => {
    expect(
      checkMemoryCapacity(
        kit('DDR5', 'Exact kit', 2, 64),
        board('AM5', 'Exact board', 'DDR5', 2, 4, 'ATX', 2, 64),
      ),
    ).toEqual({
      status: 'ok',
      moduleCount: 'ok',
      capacity: 'ok',
      issues: [],
    })
  })

  it('accepts a single module in a single slot', () => {
    expect(
      checkMemoryCapacity(
        kit('DDR5', 'Single stick', 1, 16),
        board('AM5', 'One slot', 'DDR5', 1, 2, 'Mini-ITX', 1, 32),
      ),
    ).toEqual({
      status: 'ok',
      moduleCount: 'ok',
      capacity: 'ok',
      issues: [],
    })
  })

  it('marks a kit with too many modules and names both counts', () => {
    expect(
      checkMemoryCapacity(
        kit('DDR5', 'Corsair Vengeance 64GB DDR5-5600', 4, 64),
        compact(),
      ),
    ).toEqual({
      status: 'unsupported',
      moduleCount: 'too-many',
      capacity: 'ok',
      issues: [
        {
          code: 'memory-too-many-modules',
          message:
            'Corsair Vengeance 64GB DDR5-5600 (4 modules) does not fit ASRock B650M-HDV/M.2 (2 DIMM slots).',
        },
      ],
    })
  })

  it('treats one module over the slot count as a miss', () => {
    const result = checkMemoryCapacity(
      kit('DDR5', 'Sample memory', 3, 48),
      board('AM5', 'Sample motherboard', 'DDR5', 2, 4, 'ATX', 2, 128),
    )

    expect(result.moduleCount).toBe('too-many')
    expect(result.capacity).toBe('ok')
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'memory-too-many-modules',
    ])
  })

  it('names a single module and a single slot in the singular', () => {
    expect(
      checkMemoryCapacity(
        kit('DDR5', 'Two sticks', 2, 32),
        board('AM5', 'Solo slot', 'DDR5', 1, 2, 'Mini-ITX', 1, 64),
      ).issues,
    ).toEqual([
      {
        code: 'memory-too-many-modules',
        message:
          'Two sticks (2 modules) does not fit Solo slot (1 DIMM slot).',
      },
    ])
  })

  it('marks a kit over the maximum and names both sizes', () => {
    expect(
      checkMemoryCapacity(
        kit('DDR5', 'Kingston Fury Beast 128GB DDR5-5600', 2, 128),
        compact(),
      ),
    ).toEqual({
      status: 'unsupported',
      moduleCount: 'ok',
      capacity: 'over',
      issues: [
        {
          code: 'memory-over-capacity',
          message:
            'Kingston Fury Beast 128GB DDR5-5600 (128GB) is more than ASRock B650M-HDV/M.2 supports (96GB).',
        },
      ],
    })
  })

  it('treats one gigabyte over the maximum as a miss', () => {
    const result = checkMemoryCapacity(
      kit('DDR5', 'Sample memory', 2, 97),
      compact(),
    )

    expect(result.capacity).toBe('over')
    expect(result.moduleCount).toBe('ok')
    expect(result.status).toBe('unsupported')
  })

  it('reports both problems when the kit misses the slots and the maximum', () => {
    expect(
      checkMemoryCapacity(
        kit('DDR5', 'Large kit', 4, 128),
        compact(),
      ),
    ).toEqual({
      status: 'unsupported',
      moduleCount: 'too-many',
      capacity: 'over',
      issues: [
        {
          code: 'memory-too-many-modules',
          message:
            'Large kit (4 modules) does not fit ASRock B650M-HDV/M.2 (2 DIMM slots).',
        },
        {
          code: 'memory-over-capacity',
          message:
            'Large kit (128GB) is more than ASRock B650M-HDV/M.2 supports (96GB).',
        },
      ],
    })
  })

  it('rejects any populated kit when the board lists no DIMM slots', () => {
    expect(
      checkMemoryCapacity(
        kit('DDR5', 'Sample memory', 1, 16),
        board('AM5', 'Soldered board', 'DDR5', 1, 2, 'Mini-ITX', 0, 32),
      ),
    ).toEqual({
      status: 'unsupported',
      moduleCount: 'too-many',
      capacity: 'ok',
      issues: [
        {
          code: 'memory-too-many-modules',
          message:
            'Sample memory (1 module) does not fit Soldered board (0 DIMM slots).',
        },
      ],
    })
  })

  it('reports a kit that does not list a module count', () => {
    expect(
      checkMemoryCapacity(
        { name: 'Unlisted kit', capacityGb: 32 },
        compact(),
      ),
    ).toEqual({
      status: 'missing',
      moduleCount: 'skipped',
      capacity: 'ok',
      issues: [
        {
          code: 'memory-modules-missing',
          message: 'Unlisted kit does not list a module count.',
        },
      ],
    })
  })

  it('reports a board that does not list DIMM slots', () => {
    expect(
      checkMemoryCapacity(vengeance(), {
        name: 'Mystery board',
        maxMemoryGb: 128,
      }),
    ).toEqual({
      status: 'missing',
      moduleCount: 'skipped',
      capacity: 'ok',
      issues: [
        {
          code: 'memory-modules-missing',
          message: 'Mystery board does not list DIMM slots.',
        },
      ],
    })
  })

  it('reports a kit that does not list a capacity', () => {
    expect(
      checkMemoryCapacity({ name: 'Unlisted kit', modules: 2 }, b650()),
    ).toEqual({
      status: 'missing',
      moduleCount: 'ok',
      capacity: 'skipped',
      issues: [
        {
          code: 'memory-capacity-missing',
          message: 'Unlisted kit does not list a capacity.',
        },
      ],
    })
  })

  it('reports a board that does not list a maximum memory size', () => {
    expect(
      checkMemoryCapacity(vengeance(), {
        name: 'Mystery board',
        dimmSlots: 4,
      }),
    ).toEqual({
      status: 'missing',
      moduleCount: 'ok',
      capacity: 'skipped',
      issues: [
        {
          code: 'memory-capacity-missing',
          message: 'Mystery board does not list a maximum memory size.',
        },
      ],
    })
  })

  it('reports both parts when neither lists modules or capacity', () => {
    expect(
      checkMemoryCapacity(
        { name: 'Unlisted kit' },
        { name: 'Mystery board' },
      ),
    ).toEqual({
      status: 'missing',
      moduleCount: 'skipped',
      capacity: 'skipped',
      issues: [
        {
          code: 'memory-modules-missing',
          message:
            'Unlisted kit does not list a module count, and Mystery board does not list DIMM slots.',
        },
        {
          code: 'memory-capacity-missing',
          message:
            'Unlisted kit does not list a capacity, and Mystery board does not list a maximum memory size.',
        },
      ],
    })
  })

  it('keeps a real miss when the other figure is missing', () => {
    expect(
      checkMemoryCapacity(
        { name: 'Four stick kit', modules: 4 },
        { name: 'Compact board', dimmSlots: 2 },
      ),
    ).toEqual({
      status: 'unsupported',
      moduleCount: 'too-many',
      capacity: 'skipped',
      issues: [
        {
          code: 'memory-too-many-modules',
          message:
            'Four stick kit (4 modules) does not fit Compact board (2 DIMM slots).',
        },
        {
          code: 'memory-capacity-missing',
          message:
            'Four stick kit does not list a capacity, and Compact board does not list a maximum memory size.',
        },
      ],
    })

    expect(
      checkMemoryCapacity(
        { name: 'Huge kit', capacityGb: 128 },
        { name: 'Compact board', maxMemoryGb: 96 },
      ),
    ).toEqual({
      status: 'unsupported',
      moduleCount: 'skipped',
      capacity: 'over',
      issues: [
        {
          code: 'memory-modules-missing',
          message:
            'Huge kit does not list a module count, and Compact board does not list DIMM slots.',
        },
        {
          code: 'memory-over-capacity',
          message:
            'Huge kit (128GB) is more than Compact board supports (96GB).',
        },
      ],
    })
  })

  it('treats an unusable module count or slot count as missing data', () => {
    for (const modules of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = checkMemoryCapacity(
        { name: 'Odd kit', modules, capacityGb: 32 },
        b650(),
      )
      expect(result.moduleCount).toBe('skipped')
      expect(result.status).toBe('missing')
    }

    for (const dimmSlots of [-1, 1.5, Number.NaN]) {
      const result = checkMemoryCapacity(vengeance(), {
        name: 'Odd board',
        dimmSlots,
        maxMemoryGb: 192,
      })
      expect(result.moduleCount).toBe('skipped')
      expect(result.issues[0]?.message).toBe(
        'Odd board does not list DIMM slots.',
      )
    }
  })

  it('treats an unusable capacity or maximum as missing data', () => {
    for (const capacityGb of [0, -4, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = checkMemoryCapacity(
        { name: 'Odd kit', modules: 2, capacityGb },
        b650(),
      )
      expect(result.capacity).toBe('skipped')
      expect(result.issues.map((issue) => issue.code)).toEqual([
        'memory-capacity-missing',
      ])
    }

    for (const maxMemoryGb of [0, -1, Number.NaN]) {
      const result = checkMemoryCapacity(vengeance(), {
        name: 'Odd board',
        dimmSlots: 4,
        maxMemoryGb,
      })
      expect(result.capacity).toBe('skipped')
      expect(result.issues[0]?.message).toBe(
        'Odd board does not list a maximum memory size.',
      )
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

describe('checkCaseClearance', () => {
  const north = () => chassis(355, 170, 'Fractal Design North')

  it('accepts a graphics card and cooler that fit inside the case', () => {
    const result = checkCaseClearance(
      north(),
      card(115, 'NVIDIA GeForce RTX 4060', 240),
      tower(70, 'Noctua NH-L12S'),
    )

    expect(result).toEqual({
      gpuLength: 'ok',
      coolerHeight: 'ok',
      issues: [],
    })
  })

  it('accepts a card and cooler that match the case limits exactly', () => {
    const result = checkCaseClearance(
      north(),
      card(115, 'Sample GPU', 355),
      tower(170),
    )

    expect(result).toEqual({
      gpuLength: 'ok',
      coolerHeight: 'ok',
      issues: [],
    })
  })

  it('marks a graphics card too long and names both lengths', () => {
    const result = checkCaseClearance(
      chassis(330, 155, 'Cooler Master NR200P'),
      card(450, 'NVIDIA GeForce RTX 4090', 336),
      tower(70, 'Noctua NH-L12S'),
    )

    expect(result).toEqual({
      gpuLength: 'too-long',
      coolerHeight: 'ok',
      issues: [
        {
          code: 'gpu-too-long',
          message:
            'NVIDIA GeForce RTX 4090 (336mm) is longer than Cooler Master NR200P allows (330mm).',
        },
      ],
    })
  })

  it('marks a cooler too tall and names both heights', () => {
    const result = checkCaseClearance(
      chassis(330, 155, 'Cooler Master NR200P'),
      card(115, 'NVIDIA GeForce RTX 4060', 240),
      tower(165, 'Noctua NH-D15'),
    )

    expect(result).toEqual({
      gpuLength: 'ok',
      coolerHeight: 'too-tall',
      issues: [
        {
          code: 'cooler-too-tall',
          message:
            'Noctua NH-D15 (165mm) is taller than Cooler Master NR200P allows (155mm).',
        },
      ],
    })
  })

  it('reports both problems when the card is too long and the cooler is too tall', () => {
    const result = checkCaseClearance(
      chassis(270, 61, 'SilverStone SUGO SG13'),
      card(450, 'NVIDIA GeForce RTX 4090', 304),
      tower(165, 'Noctua NH-D15'),
    )

    expect(result).toEqual({
      gpuLength: 'too-long',
      coolerHeight: 'too-tall',
      issues: [
        {
          code: 'gpu-too-long',
          message:
            'NVIDIA GeForce RTX 4090 (304mm) is longer than SilverStone SUGO SG13 allows (270mm).',
        },
        {
          code: 'cooler-too-tall',
          message:
            'Noctua NH-D15 (165mm) is taller than SilverStone SUGO SG13 allows (61mm).',
        },
      ],
    })
  })

  it('treats one millimetre over either limit as a miss', () => {
    const result = checkCaseClearance(
      chassis(330, 155),
      card(200, 'Sample GPU', 331),
      tower(156),
    )

    expect(result.gpuLength).toBe('too-long')
    expect(result.coolerHeight).toBe('too-tall')
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'gpu-too-long',
      'cooler-too-tall',
    ])
  })

  it('skips the graphics card check when no card is selected', () => {
    const result = checkCaseClearance(
      north(),
      null,
      tower(70, 'Noctua NH-L12S'),
    )

    expect(result).toEqual({
      gpuLength: 'skipped',
      coolerHeight: 'ok',
      issues: [],
    })
  })

  it('skips the graphics card check and still flags a cooler that is too tall', () => {
    const result = checkCaseClearance(
      chassis(330, 155, 'Cooler Master NR200P'),
      null,
      tower(165, 'Noctua NH-D15'),
    )

    expect(result.gpuLength).toBe('skipped')
    expect(result.coolerHeight).toBe('too-tall')
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'cooler-too-tall',
    ])
  })

  it('skips the cooler check when no cooler is selected', () => {
    const result = checkCaseClearance(
      chassis(270, 61, 'SilverStone SUGO SG13'),
      card(450, 'NVIDIA GeForce RTX 4090', 304),
      null,
    )

    expect(result).toEqual({
      gpuLength: 'too-long',
      coolerHeight: 'skipped',
      issues: [
        {
          code: 'gpu-too-long',
          message:
            'NVIDIA GeForce RTX 4090 (304mm) is longer than SilverStone SUGO SG13 allows (270mm).',
        },
      ],
    })
  })

  it('skips both checks when no case is selected', () => {
    const result = checkCaseClearance(
      null,
      card(450, 'NVIDIA GeForce RTX 4090', 304),
      tower(165, 'Noctua NH-D15'),
    )

    expect(result).toEqual({
      gpuLength: 'skipped',
      coolerHeight: 'skipped',
      issues: [
        {
          code: 'case-missing',
          message:
            'Select a case to check graphics card length and cooler height.',
        },
      ],
    })
  })

  it('skips both checks when the case has no card or cooler to compare', () => {
    expect(checkCaseClearance(north(), null, null)).toEqual({
      gpuLength: 'skipped',
      coolerHeight: 'skipped',
      issues: [],
    })
  })
})

describe('checkStorageInterface', () => {
  it('accepts an M.2 NVMe drive when the motherboard has an M.2 slot', () => {
    const result = checkStorageInterface(
      drive('M.2 NVMe', 'WD Black SN770 1TB'),
      board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 3, 4),
    )

    expect(result).toEqual({ status: 'ok', issues: [] })
  })

  it('accepts a SATA drive when the motherboard has a SATA port', () => {
    const result = checkStorageInterface(
      drive('SATA', 'Samsung 870 EVO 1TB'),
      board('AM4', 'MSI MAG B550 Tomahawk', 'DDR4', 2, 6),
    )

    expect(result).toEqual({ status: 'ok', issues: [] })
  })

  it('accepts a drive when the motherboard has exactly one matching slot', () => {
    expect(
      checkStorageInterface(
        drive('M.2 NVMe'),
        board('AM5', 'Sample motherboard', 'DDR5', 1, 0),
      ).status,
    ).toBe('ok')
    expect(
      checkStorageInterface(
        drive('SATA'),
        board('AM5', 'Sample motherboard', 'DDR5', 0, 1),
      ).status,
    ).toBe('ok')
  })

  it('rejects an M.2 NVMe drive when the motherboard has no M.2 slots', () => {
    const result = checkStorageInterface(
      drive('M.2 NVMe', 'WD Black SN770 1TB'),
      board('AM5', 'Sample motherboard', 'DDR5', 0, 6),
    )

    expect(result).toEqual({
      status: 'unsupported',
      issues: [
        {
          code: 'storage-unsupported',
          message:
            'WD Black SN770 1TB (M.2 NVMe) does not fit Sample motherboard (0 M.2 slots).',
        },
      ],
    })
  })

  it('rejects a SATA drive when the motherboard has no SATA ports', () => {
    const result = checkStorageInterface(
      drive('SATA', 'Samsung 870 EVO 1TB'),
      board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 3, 0),
    )

    expect(result).toEqual({
      status: 'unsupported',
      issues: [
        {
          code: 'storage-unsupported',
          message:
            'Samsung 870 EVO 1TB (SATA) does not fit ASUS TUF Gaming B650-PLUS (0 SATA ports).',
        },
      ],
    })
  })

  it('reports a missing drive when none is selected', () => {
    const result = checkStorageInterface(
      null,
      board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 3, 4),
    )

    expect(result).toEqual({
      status: 'missing',
      issues: [
        {
          code: 'storage-missing',
          message:
            'Select a drive to check its interface against the motherboard.',
        },
      ],
    })
  })
})

describe('checkMotherboardFormFactor', () => {
  const b650 = () =>
    board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 3, 4, 'ATX')
  const north = () =>
    chassis(355, 170, 'Fractal Design North', [
      'ATX',
      'Micro-ATX',
      'Mini-ITX',
    ])
  const miniCase = () =>
    chassis(330, 155, 'Cooler Master NR200P', ['Mini-ITX'])

  it('accepts a board whose size the case lists', () => {
    expect(checkMotherboardFormFactor(b650(), north())).toEqual({
      status: 'ok',
      issues: [],
    })
  })

  it('accepts a board when the case lists only that size', () => {
    const mini = board(
      'AM5',
      'ASUS ROG Strix B650E-I',
      'DDR5',
      2,
      4,
      'Mini-ITX',
    )

    expect(checkMotherboardFormFactor(mini, miniCase())).toEqual({
      status: 'ok',
      issues: [],
    })
  })

  it('accepts every listed size, including ones smaller than the largest', () => {
    const sizes = ['ATX', 'Micro-ATX', 'Mini-ITX'] as const
    const pcCase = chassis(355, 170, 'Full tower', sizes)

    for (const formFactor of sizes) {
      expect(
        checkMotherboardFormFactor(
          board('AM5', 'Sample motherboard', 'DDR5', 2, 4, formFactor),
          pcCase,
        ).status,
      ).toBe('ok')
    }
  })

  it('rejects a larger board the case does not list and names both sizes', () => {
    expect(checkMotherboardFormFactor(b650(), miniCase())).toEqual({
      status: 'unsupported',
      issues: [
        {
          code: 'form-factor-unsupported',
          message:
            'ASUS TUF Gaming B650-PLUS (ATX) does not fit Cooler Master NR200P (Mini-ITX).',
        },
      ],
    })
  })

  it('rejects a smaller board when that size is not on the case list', () => {
    expect(
      checkMotherboardFormFactor(
        board('AM5', 'Mini board', 'DDR5', 1, 2, 'Mini-ITX'),
        chassis(300, 160, 'ATX only', ['ATX']),
      ),
    ).toEqual({
      status: 'unsupported',
      issues: [
        {
          code: 'form-factor-unsupported',
          message: 'Mini board (Mini-ITX) does not fit ATX only (ATX).',
        },
      ],
    })
  })

  it('rejects Micro-ATX when the case lists the sizes on either side of it', () => {
    expect(
      checkMotherboardFormFactor(
        board('AM5', 'M-ATX board', 'DDR5', 2, 4, 'Micro-ATX'),
        chassis(300, 160, 'Skipped middle', ['ATX', 'Mini-ITX']),
      ),
    ).toEqual({
      status: 'unsupported',
      issues: [
        {
          code: 'form-factor-unsupported',
          message:
            'M-ATX board (Micro-ATX) does not fit Skipped middle (ATX, Mini-ITX).',
        },
      ],
    })
  })

  it('asks for a case when none is selected', () => {
    expect(checkMotherboardFormFactor(b650(), null)).toEqual({
      status: 'missing',
      issues: [
        {
          code: 'form-factor-missing',
          message: 'Select a case to check the motherboard form factor.',
        },
      ],
    })
  })

  it('reports a motherboard that does not list a form factor', () => {
    expect(
      checkMotherboardFormFactor({ name: 'Unlisted board' }, north()),
    ).toEqual({
      status: 'missing',
      issues: [
        {
          code: 'form-factor-missing',
          message: 'Unlisted board does not list a form factor.',
        },
      ],
    })

    expect(
      checkMotherboardFormFactor(
        { name: 'Unlisted board', formFactor: null },
        north(),
      ).status,
    ).toBe('missing')
  })

  it('reports a case that does not list the sizes it supports', () => {
    expect(
      checkMotherboardFormFactor(b650(), chassis(355, 170, 'Mystery case', [])),
    ).toEqual({
      status: 'missing',
      issues: [
        {
          code: 'form-factor-missing',
          message:
            'Mystery case does not list the motherboard sizes it supports.',
        },
      ],
    })

    expect(
      checkMotherboardFormFactor(b650(), { name: 'Mystery case' }).issues[0]
        ?.message,
    ).toBe('Mystery case does not list the motherboard sizes it supports.')
  })

  it('reports both parts when neither lists a size', () => {
    expect(
      checkMotherboardFormFactor(
        { name: 'Unlisted board' },
        { name: 'Mystery case', supportedFormFactors: [] },
      ),
    ).toEqual({
      status: 'missing',
      issues: [
        {
          code: 'form-factor-missing',
          message:
            'Unlisted board does not list a form factor, and Mystery case does not list the motherboard sizes it supports.',
        },
      ],
    })
  })

  it('treats an unrecognized size as missing data', () => {
    expect(
      checkMotherboardFormFactor(
        { name: 'Odd board', formFactor: 'E-ATX' as 'ATX' },
        north(),
      ),
    ).toEqual({
      status: 'missing',
      issues: [
        {
          code: 'form-factor-missing',
          message: 'Odd board does not list a form factor.',
        },
      ],
    })

    expect(
      checkMotherboardFormFactor(b650(), {
        name: 'Odd case',
        supportedFormFactors: ['E-ATX' as 'ATX'],
      }),
    ).toEqual({
      status: 'missing',
      issues: [
        {
          code: 'form-factor-missing',
          message:
            'Odd case does not list the motherboard sizes it supports.',
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

  it('records a length on every graphics card and limits on every case and cooler', () => {
    for (const part of gpus) {
      expect(part.lengthMm).toBeGreaterThan(0)
    }
    expect(coolers.length).toBeGreaterThan(0)
    for (const part of coolers) {
      expect(part.heightMm).toBeGreaterThan(0)
    }
    expect(cases.length).toBeGreaterThan(0)
    for (const part of cases) {
      expect(part.maxGpuLengthMm).toBeGreaterThan(0)
      expect(part.maxCoolerHeightMm).toBeGreaterThan(0)
    }
  })

  it('includes a case that fits, one the card is too long for, and one the cooler is too tall for', () => {
    const cardPart = gpus.find((item) => item.id === 'gpu-4090')
    const cooler = coolers.find((item) => item.id === 'cooler-nhd15')
    if (!cardPart || !cooler) {
      throw new Error('expected the RTX 4090 and NH-D15 in the catalog')
    }

    const results = cases.map((item) =>
      checkCaseClearance(item, cardPart, cooler),
    )

    expect(
      results.some(
        (result) => result.gpuLength === 'ok' && result.coolerHeight === 'ok',
      ),
    ).toBe(true)
    expect(results.some((result) => result.gpuLength === 'too-long')).toBe(true)
    expect(
      results.some(
        (result) =>
          result.coolerHeight === 'too-tall' && result.gpuLength === 'ok',
      ),
    ).toBe(true)
  })

  it('records an interface on every drive and slot counts on every motherboard', () => {
    const interfaces = ['M.2 NVMe', 'SATA'] as const

    expect(storage.length).toBeGreaterThan(0)
    for (const part of storage) {
      expect(interfaces).toContain(part.interface)
    }
    for (const storageInterface of interfaces) {
      expect(storage.some((part) => part.interface === storageInterface)).toBe(
        true,
      )
    }

    for (const part of motherboards) {
      expect(Number.isInteger(part.m2Slots)).toBe(true)
      expect(Number.isInteger(part.sataPorts)).toBe(true)
      expect(part.m2Slots).toBeGreaterThan(0)
      expect(part.sataPorts).toBeGreaterThan(0)
    }
  })

  it('records a form factor on every motherboard and supported sizes on every case', () => {
    const sizes = ['ATX', 'Micro-ATX', 'Mini-ITX'] as const

    expect(motherboards.length).toBeGreaterThan(0)
    for (const part of motherboards) {
      expect(sizes).toContain(part.formFactor)
    }

    expect(cases.length).toBeGreaterThan(0)
    for (const part of cases) {
      expect(part.supportedFormFactors.length).toBeGreaterThan(0)
      for (const size of part.supportedFormFactors) {
        expect(sizes).toContain(size)
      }
    }
  })

  it('includes a case that fits each sample board and a case that does not', () => {
    for (const part of motherboards) {
      const results = cases.map((pcCase) =>
        checkMotherboardFormFactor(part, pcCase),
      )

      expect(results.some((result) => result.status === 'ok')).toBe(true)
      expect(results.some((result) => result.status === 'unsupported')).toBe(
        true,
      )
    }
  })

  it('records module counts and capacity on every kit, and slots and a maximum on every board', () => {
    expect(memory.length).toBeGreaterThan(0)
    for (const part of memory) {
      expect(Number.isInteger(part.modules)).toBe(true)
      expect(part.modules).toBeGreaterThan(0)
      expect(part.capacityGb).toBeGreaterThan(0)
    }

    for (const part of motherboards) {
      expect(Number.isInteger(part.dimmSlots)).toBe(true)
      expect(part.dimmSlots).toBeGreaterThan(0)
      expect(part.maxMemoryGb).toBeGreaterThan(0)
    }
  })

  it('includes a kit that fits, one with too many modules, and one over the maximum', () => {
    const compact = motherboards.find((part) => part.id === 'board-b650m')
    const full = motherboards.find((part) => part.id === 'board-b650')
    const pair = memory.find((part) => part.id === 'mem-ddr5-6000')
    const four = memory.find((part) => part.id === 'mem-ddr5-64')
    const large = memory.find((part) => part.id === 'mem-ddr5-128')
    if (!compact || !full || !pair || !four || !large) {
      throw new Error('expected the memory capacity sample parts')
    }

    expect(checkMemoryCapacity(pair, compact)).toEqual({
      status: 'ok',
      moduleCount: 'ok',
      capacity: 'ok',
      issues: [],
    })
    expect(checkMemoryCapacity(four, full).status).toBe('ok')
    expect(checkMemoryCapacity(large, full).status).toBe('ok')

    const tooMany = checkMemoryCapacity(four, compact)
    expect(tooMany.status).toBe('unsupported')
    expect(tooMany.moduleCount).toBe('too-many')
    expect(tooMany.capacity).toBe('ok')

    const over = checkMemoryCapacity(large, compact)
    expect(over.status).toBe('unsupported')
    expect(over.moduleCount).toBe('ok')
    expect(over.capacity).toBe('over')
  })

  it('pairs every sample drive with a motherboard that supports it', () => {
    for (const part of storage) {
      expect(
        motherboards.some(
          (item) => checkStorageInterface(part, item).status === 'ok',
        ),
      ).toBe(true)
    }
  })
})
