import { describe, expect, it } from 'vitest'
import { buildStatusSummary, type BuildStatusChecks } from './buildStatus.ts'
import {
  checkCaseClearance,
  checkCpuSocket,
  checkMemoryCapacity,
  checkMemoryType,
  checkMotherboardFormFactor,
  checkPowerSupply,
  checkStorageInterface,
  type BoardFormFactor,
  type Case,
  type Cpu,
  type CpuCooler,
  type CpuSocket,
  type Gpu,
  type Memory,
  type MemoryType,
  type Motherboard,
  type Psu,
  type StorageDrive,
  type StorageInterface,
} from './compatibility.ts'

function cpu(socket: CpuSocket, name = 'Sample CPU', tdpWatts = 65): Cpu {
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

function tower(heightMm: number, name = 'Sample cooler'): CpuCooler {
  return { id: `cooler-${heightMm}`, name, heightMm }
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
  return { id: `drive-${storageInterface}`, name, interface: storageInterface }
}

function checksFor(parts: {
  cpu: Cpu
  motherboard: Motherboard
  memory: Memory
  gpu: Gpu | null
  cooler: CpuCooler | null
  pcCase: Case | null
  psu: Psu | null
  storage: StorageDrive | null
}) {
  return {
    socket: checkCpuSocket(parts.cpu, parts.motherboard),
    memory: checkMemoryType(parts.memory, parts.motherboard),
    memoryCapacity: checkMemoryCapacity(parts.memory, parts.motherboard),
    power: checkPowerSupply(parts.cpu, parts.gpu, parts.psu),
    clearance: checkCaseClearance(parts.pcCase, parts.gpu, parts.cooler),
    storage: checkStorageInterface(parts.storage, parts.motherboard),
    formFactor: checkMotherboardFormFactor(parts.motherboard, parts.pcCase),
  }
}

const passing = () =>
  checksFor({
    cpu: cpu('AM5', 'AMD Ryzen 5 7600', 65),
    motherboard: board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 2, 4),
    memory: kit('DDR5', 'Corsair Vengeance 32GB DDR5-6000'),
    gpu: card(115, 'NVIDIA GeForce RTX 4060', 240),
    cooler: tower(70, 'Noctua NH-L12S'),
    pcCase: chassis(355, 170, 'Fractal Design North'),
    psu: supply(650, 'Corsair RM650x'),
    storage: drive('M.2 NVMe', 'WD Black SN770 1TB'),
  })

describe('buildStatusSummary', () => {
  it('asks for a CPU and motherboard when the selection is empty', () => {
    expect(
      buildStatusSummary(
        { cpu: null, motherboard: null },
        {
          socket: null,
          memory: null,
          memoryCapacity: null,
          power: null,
          clearance: null,
          storage: null,
          formFactor: null,
        },
      ),
    ).toEqual({
      level: 'start',
      text: 'Pick a CPU and motherboard to start',
    })
  })

  it('asks for both core parts when only one of them is selected', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600')
    const emptyChecks: BuildStatusChecks = {
      socket: null,
      memory: null,
      memoryCapacity: null,
      power: null,
      clearance: null,
      storage: null,
      formFactor: null,
    }

    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: null }, emptyChecks),
    ).toEqual({
      level: 'start',
      text: 'Pick a CPU and motherboard to start',
    })
    expect(
      buildStatusSummary(
        { cpu: null, motherboard: board('AM5') },
        emptyChecks,
      ),
    ).toEqual({
      level: 'start',
      text: 'Pick a CPU and motherboard to start',
    })
  })

  it('stays on the starting prompt when other checks already report issues', () => {
    const summary = buildStatusSummary(
      { cpu: null, motherboard: null },
      {
        socket: null,
        memory: null,
        memoryCapacity: null,
        power: null,
        clearance: checkCaseClearance(
          chassis(270, 61, 'SilverStone SUGO SG13'),
          card(450, 'NVIDIA GeForce RTX 4090', 304),
          tower(165, 'Noctua NH-D15'),
        ),
        storage: null,
        formFactor: null,
      },
    )

    expect(summary).toEqual({
      level: 'start',
      text: 'Pick a CPU and motherboard to start',
    })
  })

  it('reports that every check passes', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const b650 = board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 2, 4)

    expect(buildStatusSummary({ cpu: ryzen, motherboard: b650 }, passing())).toEqual(
      { level: 'ok', text: 'All checks pass' },
    )
  })

  it('reports one compatibility issue', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const b550 = board('AM4', 'MSI MAG B550 Tomahawk', 'DDR4', 2, 6)
    const checks = passing()
    checks.socket = checkCpuSocket(ryzen, b550)

    expect(buildStatusSummary({ cpu: ryzen, motherboard: b550 }, checks)).toEqual(
      { level: 'issue', text: '1 compatibility issue' },
    )
  })

  it('counts several compatibility issues', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const b650 = board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 2, 4)
    const two = passing()
    two.clearance = checkCaseClearance(
      chassis(270, 61, 'SilverStone SUGO SG13'),
      card(450, 'NVIDIA GeForce RTX 4090', 304),
      tower(165, 'Noctua NH-D15'),
    )

    expect(buildStatusSummary({ cpu: ryzen, motherboard: b650 }, two)).toEqual({
      level: 'issue',
      text: '2 compatibility issues',
    })

    const b550 = board('AM4', 'MSI MAG B550 Tomahawk', 'DDR4', 2, 6)
    const three = passing()
    three.socket = checkCpuSocket(ryzen, b550)
    three.memory = checkMemoryType(
      kit('DDR5', 'Corsair Vengeance 32GB DDR5-6000'),
      b550,
    )
    three.power = checkPowerSupply(
      ryzen,
      card(450, 'NVIDIA GeForce RTX 4090', 304),
      supply(550, 'Corsair CX550'),
    )

    expect(buildStatusSummary({ cpu: ryzen, motherboard: b550 }, three)).toEqual(
      { level: 'issue', text: '3 compatibility issues' },
    )
  })

  it('ignores a tight supply and parts that are not selected yet', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const b650 = board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 2, 4)
    const checks = checksFor({
      cpu: ryzen,
      motherboard: b650,
      memory: kit('DDR5'),
      gpu: card(450, 'NVIDIA GeForce RTX 4090', 304),
      cooler: null,
      pcCase: null,
      psu: supply(650, 'Corsair RM650x'),
      storage: null,
    })

    expect(checks.power.status).toBe('tight')
    expect(checks.clearance.issues.map((issue) => issue.code)).toEqual([
      'case-missing',
    ])
    expect(checks.storage.status).toBe('missing')
    expect(buildStatusSummary({ cpu: ryzen, motherboard: b650 }, checks)).toEqual(
      { level: 'ok', text: 'All checks pass' },
    )
  })

  it('counts a kit with too many modules', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const compact = board(
      'AM5',
      'ASRock B650M-HDV/M.2',
      'DDR5',
      1,
      4,
      'Micro-ATX',
      2,
      96,
    )
    const checks = passing()
    checks.memoryCapacity = checkMemoryCapacity(
      kit('DDR5', 'Corsair Vengeance 64GB DDR5-5600', 4, 64),
      compact,
    )

    expect(checks.memoryCapacity.moduleCount).toBe('too-many')
    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: compact }, checks),
    ).toEqual({ level: 'issue', text: '1 compatibility issue' })
  })

  it('counts a kit over the memory maximum', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const compact = board(
      'AM5',
      'ASRock B650M-HDV/M.2',
      'DDR5',
      1,
      4,
      'Micro-ATX',
      2,
      96,
    )
    const checks = passing()
    checks.memoryCapacity = checkMemoryCapacity(
      kit('DDR5', 'Kingston Fury Beast 128GB DDR5-5600', 2, 128),
      compact,
    )

    expect(checks.memoryCapacity.capacity).toBe('over')
    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: compact }, checks),
    ).toEqual({ level: 'issue', text: '1 compatibility issue' })
  })

  it('counts both a module miss and a capacity miss', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const compact = board(
      'AM5',
      'ASRock B650M-HDV/M.2',
      'DDR5',
      1,
      4,
      'Micro-ATX',
      2,
      96,
    )
    const checks = passing()
    checks.memoryCapacity = checkMemoryCapacity(
      kit('DDR5', 'Large kit', 4, 128),
      compact,
    )

    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: compact }, checks),
    ).toEqual({ level: 'issue', text: '2 compatibility issues' })
  })

  it('ignores memory capacity the parts do not list', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const b650 = board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 2, 4)
    const checks = passing()

    checks.memoryCapacity = checkMemoryCapacity(
      { name: 'Unlisted kit' },
      { name: 'Mystery board' },
    )
    expect(checks.memoryCapacity.status).toBe('missing')
    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: b650 }, checks),
    ).toEqual({ level: 'ok', text: 'All checks pass' })

    checks.memoryCapacity = checkMemoryCapacity(
      { name: 'Unlisted kit', modules: 2 },
      { name: 'Mystery board', dimmSlots: 4, maxMemoryGb: 128 },
    )
    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: b650 }, checks),
    ).toEqual({ level: 'ok', text: 'All checks pass' })
  })

  it('still counts a listed miss when the other memory figure is missing', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const b650 = board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 2, 4)
    const checks = passing()
    checks.memoryCapacity = checkMemoryCapacity(
      { name: 'Four stick kit', modules: 4 },
      { name: 'Compact board', dimmSlots: 2 },
    )

    expect(checks.memoryCapacity.status).toBe('unsupported')
    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: b650 }, checks),
    ).toEqual({ level: 'issue', text: '1 compatibility issue' })
  })

  it('counts a motherboard the case cannot take', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const b650 = board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 2, 4, 'ATX')
    const checks = passing()
    checks.formFactor = checkMotherboardFormFactor(
      b650,
      chassis(330, 155, 'Cooler Master NR200P', ['Mini-ITX']),
    )

    expect(checks.formFactor.status).toBe('unsupported')
    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: b650 }, checks),
    ).toEqual({ level: 'issue', text: '1 compatibility issue' })
  })

  it('ignores a missing case and parts that do not list a form factor', () => {
    const ryzen = cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const b650 = board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 2, 4, 'ATX')
    const checks = passing()

    checks.formFactor = checkMotherboardFormFactor(b650, null)
    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: b650 }, checks),
    ).toEqual({ level: 'ok', text: 'All checks pass' })

    checks.formFactor = checkMotherboardFormFactor(b650, {
      name: 'Mystery case',
      supportedFormFactors: [],
    })
    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: b650 }, checks),
    ).toEqual({ level: 'ok', text: 'All checks pass' })

    checks.formFactor = checkMotherboardFormFactor(
      { name: 'Unlisted board' },
      chassis(355, 170, 'Fractal Design North'),
    )
    expect(
      buildStatusSummary({ cpu: ryzen, motherboard: b650 }, checks),
    ).toEqual({ level: 'ok', text: 'All checks pass' })
  })
})
