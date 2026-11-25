import { describe, expect, it } from 'vitest'
import type {
  BoardFormFactor,
  Case,
  Cpu,
  CpuCooler,
  CpuSocket,
  Gpu,
  Memory,
  MemoryType,
  Motherboard,
  Psu,
  StorageDrive,
  StorageInterface,
} from './compatibility.ts'
import {
  checkPartOption,
  formatIncompatibleOption,
  type SelectedBuild,
} from './partOption.ts'
import { cpus, gpus, motherboards, psus } from './parts.ts'

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
    id: `board-${socket}-${memoryType}`,
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

function card(boardPowerWatts: number, name = 'Sample GPU', lengthMm = 240): Gpu {
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
  return { id: `drive-${storageInterface}`, name, interface: storageInterface }
}

function emptyBuild(): SelectedBuild {
  return {
    cpu: null,
    motherboard: null,
    memory: null,
    gpu: null,
    cooler: null,
    case: null,
    psu: null,
    storage: null,
  }
}

function selected(partial: Partial<SelectedBuild> = {}): SelectedBuild {
  return { ...emptyBuild(), ...partial }
}

const compatible = { compatible: true, conflicts: [] }

describe('formatIncompatibleOption', () => {
  it('returns an empty suffix when there is no conflict', () => {
    expect(formatIncompatibleOption([])).toBe('')
  })

  it('names one conflict after an em dash', () => {
    expect(formatIncompatibleOption(['socket AM5'])).toBe(
      ' — incompatible: socket AM5',
    )
  })

  it('joins several conflicts in the order given', () => {
    expect(
      formatIncompatibleOption(['socket AM5', 'memory DDR5', 'no M.2 slots']),
    ).toBe(' — incompatible: socket AM5, memory DDR5, no M.2 slots')
  })
})

describe('checkPartOption', () => {
  describe('compatible parts', () => {
    const ryzen = () => cpu('AM5', 'AMD Ryzen 5 7600', 65)
    const b650 = () => board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 3, 4)
    const ddr5 = () => kit('DDR5', 'Corsair Vengeance 32GB DDR5-6000')
    const rtx4060 = () => card(115, 'NVIDIA GeForce RTX 4060', 240)
    const lowCooler = () => tower(70, 'Noctua NH-L12S')
    const north = () => chassis(355, 170, 'Fractal Design North')
    const rm650 = () => supply(650, 'Corsair RM650x')
    const nvme = () => drive('M.2 NVMe', 'WD Black SN770 1TB')

    const matching = () =>
      selected({
        cpu: ryzen(),
        motherboard: b650(),
        memory: ddr5(),
        gpu: rtx4060(),
        cooler: lowCooler(),
        case: north(),
        psu: rm650(),
        storage: nvme(),
      })

    it('accepts a processor that uses the motherboard socket', () => {
      expect(checkPartOption('cpu', ryzen(), matching())).toEqual(compatible)
    })

    it('accepts a motherboard that matches the processor, memory, and drive', () => {
      expect(checkPartOption('motherboard', b650(), matching())).toEqual(
        compatible,
      )
    })

    it('accepts memory that uses the motherboard type', () => {
      expect(checkPartOption('memory', ddr5(), matching())).toEqual(compatible)
    })

    it('accepts a kit that fits the slots and the maximum', () => {
      const motherboard = board(
        'AM5',
        'ASRock B650M-HDV/M.2',
        'DDR5',
        1,
        4,
        'Micro-ATX',
        2,
        96,
      )
      const memory = kit('DDR5', 'Corsair Vengeance 32GB DDR5-6000', 2, 32)
      const build = selected({ motherboard, memory })

      expect(checkPartOption('memory', memory, build)).toEqual(compatible)
      expect(checkPartOption('motherboard', motherboard, build)).toEqual(
        compatible,
      )
    })

    it('accepts a kit that matches the slot count and the maximum exactly', () => {
      const motherboard = board('AM5', 'Exact board', 'DDR5', 2, 4, 'ATX', 2, 64)
      const memory = kit('DDR5', 'Exact kit', 2, 64)
      const build = selected({ motherboard, memory })

      expect(checkPartOption('memory', memory, build)).toEqual(compatible)
      expect(checkPartOption('motherboard', motherboard, build)).toEqual(
        compatible,
      )
    })

    it('accepts a graphics card and cooler that fit the case exactly', () => {
      const fit = chassis(240, 70)
      const build = selected({
        gpu: rtx4060(),
        cooler: lowCooler(),
        case: fit,
      })

      expect(checkPartOption('gpu', rtx4060(), build)).toEqual(compatible)
      expect(checkPartOption('cooler', lowCooler(), build)).toEqual(compatible)
      expect(checkPartOption('case', fit, build)).toEqual(compatible)
    })

    it('accepts a SATA drive when the motherboard has a SATA port', () => {
      const sata = drive('SATA', 'Samsung 870 EVO 1TB')
      const motherboard = board('AM5', 'Sample motherboard', 'DDR5', 1, 1)
      const build = selected({ motherboard, storage: sata })

      expect(checkPartOption('storage', sata, build)).toEqual(compatible)
      expect(checkPartOption('motherboard', motherboard, build)).toEqual(
        compatible,
      )
    })

    it('accepts a supply that covers the estimated draw', () => {
      expect(checkPartOption('psu', rm650(), matching())).toEqual(compatible)
    })

    it('leaves a tight supply unmarked when it still covers the draw', () => {
      const build = selected({
        cpu: ryzen(),
        gpu: rtx4060(),
      })

      expect(checkPartOption('psu', supply(280), build)).toEqual(compatible)
      expect(checkPartOption('psu', supply(350), build)).toEqual(compatible)
    })

    it('ignores the part already chosen in the same slot', () => {
      const build = selected({
        cpu: cpu('AM4'),
        motherboard: b650(),
      })

      expect(checkPartOption('cpu', ryzen(), build)).toEqual(compatible)
    })

    it('accepts a motherboard the case lists and a case that lists that board', () => {
      const motherboard = board('AM5', 'ATX board', 'DDR5', 2, 4, 'Micro-ATX')
      const pcCase = chassis(355, 170, 'ATX case', ['ATX', 'Micro-ATX'])
      const build = selected({ motherboard, case: pcCase })

      expect(checkPartOption('motherboard', motherboard, build)).toEqual(
        compatible,
      )
      expect(checkPartOption('case', pcCase, build)).toEqual(compatible)
    })

    it('does not mark a processor or graphics card for power draw', () => {
      const hotCpu = cpu('AM5', 'Hot CPU', 250)
      const hungryGpu = card(450, 'Hungry GPU', 200)
      const build = selected({
        cpu: hotCpu,
        motherboard: b650(),
        gpu: hungryGpu,
        case: north(),
        psu: supply(100),
      })

      expect(checkPartOption('cpu', hotCpu, build)).toEqual(compatible)
      expect(checkPartOption('gpu', hungryGpu, build)).toEqual(compatible)
      expect(checkPartOption('psu', supply(100), build)).toEqual({
        compatible: false,
        conflicts: ['below 800W'],
      })
    })
  })

  describe('incompatible parts', () => {
    it('names the motherboard socket a processor does not match', () => {
      expect(
        checkPartOption(
          'cpu',
          cpu('AM4', 'AMD Ryzen 7 5800X'),
          selected({ motherboard: board('AM5', 'ASUS TUF Gaming B650-PLUS') }),
        ),
      ).toEqual({ compatible: false, conflicts: ['socket AM5'] })
    })

    it('names the processor socket a motherboard does not match', () => {
      expect(
        checkPartOption(
          'motherboard',
          board('LGA1700', 'Gigabyte Z790 Aorus Elite', 'DDR5'),
          selected({ cpu: cpu('AM5', 'AMD Ryzen 5 7600') }),
        ),
      ).toEqual({ compatible: false, conflicts: ['socket AM5'] })
    })

    it('names the memory type a kit does not match', () => {
      expect(
        checkPartOption(
          'memory',
          kit('DDR4', 'Corsair Vengeance LPX 32GB DDR4-3600'),
          selected({ motherboard: board('AM5', 'B650', 'DDR5') }),
        ),
      ).toEqual({ compatible: false, conflicts: ['memory DDR5'] })
    })

    it('marks a kit with too many modules, and the board for that kit', () => {
      const motherboard = board(
        'AM5',
        'ASRock B650M-HDV/M.2',
        'DDR5',
        1,
        4,
        'Micro-ATX',
        2,
        96,
      )
      const memory = kit('DDR5', 'Corsair Vengeance 64GB DDR5-5600', 4, 64)

      expect(
        checkPartOption('memory', memory, selected({ motherboard })),
      ).toEqual({ compatible: false, conflicts: ['2 DIMM slots'] })
      expect(
        checkPartOption('motherboard', motherboard, selected({ memory })),
      ).toEqual({ compatible: false, conflicts: ['4 modules'] })
    })

    it('marks a kit over the maximum, and the board for that kit', () => {
      const motherboard = board(
        'AM5',
        'ASRock B650M-HDV/M.2',
        'DDR5',
        1,
        4,
        'Micro-ATX',
        2,
        96,
      )
      const memory = kit('DDR5', 'Kingston Fury Beast 128GB DDR5-5600', 2, 128)

      expect(
        checkPartOption('memory', memory, selected({ motherboard })),
      ).toEqual({ compatible: false, conflicts: ['96GB memory limit'] })
      expect(
        checkPartOption('motherboard', motherboard, selected({ memory })),
      ).toEqual({ compatible: false, conflicts: ['128GB memory'] })
    })

    it('marks one module and one gigabyte over the limit', () => {
      const motherboard = board('AM5', 'Compact board', 'DDR5', 1, 2, 'ATX', 2, 64)
      const memory = kit('DDR5', 'Tall kit', 3, 65)

      expect(
        checkPartOption('memory', memory, selected({ motherboard })),
      ).toEqual({
        compatible: false,
        conflicts: ['2 DIMM slots', '64GB memory limit'],
      })
      expect(
        checkPartOption('motherboard', motherboard, selected({ memory })),
      ).toEqual({
        compatible: false,
        conflicts: ['3 modules', '65GB memory'],
      })
    })

    it('lists the memory type before capacity on a kit', () => {
      expect(
        checkPartOption(
          'memory',
          kit('DDR4', 'Old kit', 4, 128),
          selected({
            motherboard: board('AM5', 'B650', 'DDR5', 2, 4, 'ATX', 2, 96),
          }),
        ),
      ).toEqual({
        compatible: false,
        conflicts: ['memory DDR5', '2 DIMM slots', '96GB memory limit'],
      })
    })

    it('lists memory capacity after the type and before storage', () => {
      expect(
        checkPartOption(
          'motherboard',
          board('AM4', 'Tiny board', 'DDR4', 0, 0, 'ATX', 2, 64),
          selected({
            cpu: cpu('AM5'),
            memory: kit('DDR5', 'Large kit', 4, 128),
            storage: drive('M.2 NVMe'),
            case: chassis(330, 155, 'Mini case', ['Mini-ITX']),
          }),
        ),
      ).toEqual({
        compatible: false,
        conflicts: [
          'socket AM5',
          'memory DDR5',
          '4 modules',
          '128GB memory',
          'no M.2 slots',
          'case supports Mini-ITX',
        ],
      })
    })

    it('names the kit type a motherboard does not match', () => {
      expect(
        checkPartOption(
          'motherboard',
          board('AM4', 'MSI MAG B550 Tomahawk', 'DDR4'),
          selected({
            cpu: cpu('AM4'),
            memory: kit('DDR5'),
          }),
        ),
      ).toEqual({ compatible: false, conflicts: ['memory DDR5'] })
    })

    it('lists socket, memory, and storage conflicts in that order', () => {
      expect(
        checkPartOption(
          'motherboard',
          board('AM4', 'Tiny board', 'DDR4', 0, 0),
          selected({
            cpu: cpu('AM5'),
            memory: kit('DDR5'),
            storage: drive('M.2 NVMe'),
          }),
        ),
      ).toEqual({
        compatible: false,
        conflicts: ['socket AM5', 'memory DDR5', 'no M.2 slots'],
      })
    })

    it('marks a graphics card one millimetre over the case limit', () => {
      const pcCase = chassis(270, 61, 'SilverStone SUGO SG13')
      const gpu = card(450, 'NVIDIA GeForce RTX 4090', 271)

      expect(
        checkPartOption('gpu', gpu, selected({ case: pcCase })),
      ).toEqual({ compatible: false, conflicts: ['270mm GPU limit'] })
      expect(
        checkPartOption('case', pcCase, selected({ gpu })),
      ).toEqual({ compatible: false, conflicts: ['271mm GPU'] })
    })

    it('marks a cooler one millimetre over the case limit', () => {
      const pcCase = chassis(330, 155, 'Cooler Master NR200P')
      const cooler = tower(156, 'Noctua NH-D15')

      expect(
        checkPartOption('cooler', cooler, selected({ case: pcCase })),
      ).toEqual({ compatible: false, conflicts: ['155mm cooler limit'] })
      expect(
        checkPartOption('case', pcCase, selected({ cooler })),
      ).toEqual({ compatible: false, conflicts: ['156mm cooler'] })
    })

    it('marks a case for the card and the cooler that miss its limits', () => {
      const pcCase = chassis(270, 61, 'SilverStone SUGO SG13')
      const gpu = card(450, 'NVIDIA GeForce RTX 4090', 304)
      const cooler = tower(165, 'Noctua NH-D15')

      expect(checkPartOption('case', pcCase, selected({ gpu, cooler }))).toEqual(
        { compatible: false, conflicts: ['304mm GPU', '165mm cooler'] },
      )
    })

    it('marks only the clearance problem that fails', () => {
      const pcCase = chassis(270, 170)
      const gpu = card(200, 'Sample GPU', 304)
      const cooler = tower(70)

      expect(checkPartOption('case', pcCase, selected({ gpu, cooler }))).toEqual(
        { compatible: false, conflicts: ['304mm GPU'] },
      )
    })

    it('marks an M.2 drive when the motherboard has no M.2 slots', () => {
      const nvme = drive('M.2 NVMe', 'WD Black SN770 1TB')
      const motherboard = board('AM5', 'Sample motherboard', 'DDR5', 0, 6)

      expect(
        checkPartOption('storage', nvme, selected({ motherboard })),
      ).toEqual({ compatible: false, conflicts: ['no M.2 slots'] })
      expect(
        checkPartOption('motherboard', motherboard, selected({ storage: nvme })),
      ).toEqual({ compatible: false, conflicts: ['no M.2 slots'] })
    })

    it('marks a SATA drive when the motherboard has no SATA ports', () => {
      const sata = drive('SATA', 'Samsung 870 EVO 1TB')
      const motherboard = board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5', 3, 0)

      expect(
        checkPartOption('storage', sata, selected({ motherboard })),
      ).toEqual({ compatible: false, conflicts: ['no SATA ports'] })
      expect(
        checkPartOption(
          'motherboard',
          motherboard,
          selected({ storage: sata }),
        ),
      ).toEqual({ compatible: false, conflicts: ['no SATA ports'] })
    })

    it('marks a supply below the estimated draw and names that draw', () => {
      const build = selected({
        cpu: cpu('AM5', 'AMD Ryzen 5 7600', 65),
        gpu: card(450, 'NVIDIA GeForce RTX 4090', 304),
      })

      expect(checkPartOption('psu', supply(550, 'Corsair CX550'), build)).toEqual(
        { compatible: false, conflicts: ['below 615W'] },
      )
      expect(checkPartOption('psu', supply(614), build)).toEqual({
        compatible: false,
        conflicts: ['below 615W'],
      })
      expect(checkPartOption('psu', supply(615), build)).toEqual(compatible)
    })

    it('marks a supply below the integrated-graphics draw', () => {
      const build = selected({ cpu: cpu('AM5', 'AMD Ryzen 5 7600', 65) })

      expect(checkPartOption('psu', supply(164), build)).toEqual({
        compatible: false,
        conflicts: ['below 165W'],
      })
      expect(checkPartOption('psu', supply(0, 'Unrated supply'), build)).toEqual(
        { compatible: false, conflicts: ['below 165W'] },
      )
    })

    it('marks a motherboard the case does not list, and the case for that board', () => {
      const motherboard = board('AM5', 'ATX board', 'DDR5', 2, 4, 'ATX')
      const pcCase = chassis(330, 155, 'Cooler Master NR200P', ['Mini-ITX'])
      const build = selected({ motherboard, case: pcCase })

      expect(checkPartOption('motherboard', motherboard, build)).toEqual({
        compatible: false,
        conflicts: ['case supports Mini-ITX'],
      })
      expect(checkPartOption('case', pcCase, build)).toEqual({
        compatible: false,
        conflicts: ['ATX motherboard'],
      })
    })

    it('lists form factor after the other motherboard conflicts', () => {
      expect(
        checkPartOption(
          'motherboard',
          board('AM4', 'Tiny board', 'DDR4', 0, 0, 'ATX'),
          selected({
            cpu: cpu('AM5'),
            memory: kit('DDR5'),
            storage: drive('M.2 NVMe'),
            case: chassis(330, 155, 'Mini case', ['Mini-ITX']),
          }),
        ),
      ).toEqual({
        compatible: false,
        conflicts: [
          'socket AM5',
          'memory DDR5',
          'no M.2 slots',
          'case supports Mini-ITX',
        ],
      })
    })

    it('lists the motherboard size before clearance conflicts on a case', () => {
      const pcCase = chassis(270, 61, 'SilverStone SUGO SG13', ['Mini-ITX'])

      expect(
        checkPartOption(
          'case',
          pcCase,
          selected({
            motherboard: board('AM5', 'ATX board', 'DDR5', 2, 4, 'ATX'),
            gpu: card(450, 'NVIDIA GeForce RTX 4090', 304),
            cooler: tower(165, 'Noctua NH-D15'),
          }),
        ),
      ).toEqual({
        compatible: false,
        conflicts: ['ATX motherboard', '304mm GPU', '165mm cooler'],
      })
    })

    it('uses the sample catalog sockets, clearance, and wattage', () => {
      const ryzen = cpus.find((part) => part.id === 'cpu-7600')
      const am4 = cpus.find((part) => part.id === 'cpu-5800x')
      const b650 = motherboards.find((part) => part.id === 'board-b650')
      const card4090 = gpus.find((part) => part.id === 'gpu-4090')
      const cx550 = psus.find((part) => part.id === 'psu-550')
      const rm650 = psus.find((part) => part.id === 'psu-650')
      if (!ryzen || !am4 || !b650 || !card4090 || !cx550 || !rm650) {
        throw new Error('expected sample CPU, board, GPU, and supplies')
      }

      expect(
        checkPartOption('cpu', am4, selected({ motherboard: b650 })),
      ).toEqual({ compatible: false, conflicts: ['socket AM5'] })
      expect(
        checkPartOption('cpu', ryzen, selected({ motherboard: b650 })),
      ).toEqual(compatible)
      expect(
        checkPartOption(
          'psu',
          cx550,
          selected({ cpu: ryzen, gpu: card4090 }),
        ),
      ).toEqual({ compatible: false, conflicts: ['below 615W'] })
      expect(
        checkPartOption(
          'psu',
          rm650,
          selected({ cpu: ryzen, gpu: card4090 }),
        ),
      ).toEqual(compatible)
    })
  })

  describe('nothing selected yet', () => {
    const bare = emptyBuild()

    it('accepts every candidate while the build is empty', () => {
      expect(checkPartOption('cpu', cpu('AM4'), bare)).toEqual(compatible)
      expect(
        checkPartOption('motherboard', board('AM4', 'Old', 'DDR4', 0, 0), bare),
      ).toEqual(compatible)
      expect(checkPartOption('memory', kit('DDR4'), bare)).toEqual(compatible)
      expect(checkPartOption('gpu', card(450, 'Huge', 400), bare)).toEqual(
        compatible,
      )
      expect(checkPartOption('cooler', tower(200), bare)).toEqual(compatible)
      expect(checkPartOption('case', chassis(100, 20), bare)).toEqual(compatible)
      expect(checkPartOption('psu', supply(1), bare)).toEqual(compatible)
      expect(checkPartOption('storage', drive('SATA'), bare)).toEqual(compatible)
    })

    it('skips graphics-card length when no case is selected', () => {
      expect(
        checkPartOption('gpu', card(450, 'Huge', 400), selected()),
      ).toEqual(compatible)
    })

    it('skips cooler height when no case is selected', () => {
      expect(checkPartOption('cooler', tower(200), selected())).toEqual(
        compatible,
      )
    })

    it('skips case clearance for a part that is not selected', () => {
      const pcCase = chassis(100, 20, 'Tiny case')

      expect(
        checkPartOption('case', pcCase, selected({ gpu: null, cooler: null })),
      ).toEqual(compatible)
      expect(
        checkPartOption(
          'case',
          pcCase,
          selected({ gpu: card(200, 'Long', 300) }),
        ),
      ).toEqual({ compatible: false, conflicts: ['300mm GPU'] })
      expect(
        checkPartOption('case', pcCase, selected({ cooler: tower(80) })),
      ).toEqual({ compatible: false, conflicts: ['80mm cooler'] })
    })

    it('skips storage until a motherboard or a drive is selected', () => {
      const nvme = drive('M.2 NVMe')
      const emptyBoard = board('AM5', 'No slots', 'DDR5', 0, 0)

      expect(checkPartOption('storage', nvme, selected())).toEqual(compatible)
      expect(checkPartOption('motherboard', emptyBoard, selected())).toEqual(
        compatible,
      )
    })

    it('skips power until a processor is selected', () => {
      expect(
        checkPartOption(
          'psu',
          supply(1),
          selected({ gpu: card(450, 'Hungry', 300) }),
        ),
      ).toEqual(compatible)
    })

    it('skips form factor until a case or a motherboard is selected', () => {
      const atx = board('AM5', 'ATX board', 'DDR5', 2, 4, 'ATX')
      const mini = chassis(330, 155, 'Mini case', ['Mini-ITX'])

      expect(checkPartOption('motherboard', atx, selected())).toEqual(
        compatible,
      )
      expect(checkPartOption('case', mini, selected())).toEqual(compatible)
    })

    it('leaves the options unmarked when the size data is missing', () => {
      const motherboard = board('AM5', 'ATX board', 'DDR5', 2, 4, 'ATX')
      const mystery = chassis(355, 170, 'Mystery case', [])
      const listed = selected({ motherboard, case: mystery })

      expect(checkPartOption('motherboard', motherboard, listed)).toEqual(
        compatible,
      )
      expect(checkPartOption('case', mystery, listed)).toEqual(compatible)

      const bare = {
        ...motherboard,
        formFactor: undefined,
      } as unknown as Motherboard
      const pcCase = chassis(355, 170, 'Fractal Design North')
      const unlisted = selected({ motherboard: bare, case: pcCase })

      expect(checkPartOption('motherboard', bare, unlisted)).toEqual(compatible)
      expect(checkPartOption('case', pcCase, unlisted)).toEqual(compatible)
    })

    it('skips memory capacity until a motherboard or a kit is selected', () => {
      const huge = kit('DDR5', 'Huge', 4, 256)
      const tiny = board('AM5', 'Tiny', 'DDR5', 1, 4, 'ATX', 2, 32)

      expect(checkPartOption('memory', huge, selected())).toEqual(compatible)
      expect(checkPartOption('motherboard', tiny, selected())).toEqual(
        compatible,
      )
    })

    it('leaves the options unmarked when the capacity data is missing', () => {
      const motherboard = board('AM5', 'ATX board', 'DDR5', 2, 4, 'ATX', 2, 64)
      const memory = kit('DDR5', 'Large kit', 4, 128)
      const bareBoard = {
        ...motherboard,
        dimmSlots: undefined,
        maxMemoryGb: undefined,
      } as unknown as Motherboard
      const bareKit = {
        ...memory,
        modules: undefined,
        capacityGb: undefined,
      } as unknown as Memory
      const listedBoard = selected({ motherboard: bareBoard, memory })
      const listedKit = selected({ motherboard, memory: bareKit })

      expect(checkPartOption('memory', memory, listedBoard)).toEqual(compatible)
      expect(checkPartOption('motherboard', bareBoard, listedBoard)).toEqual(
        compatible,
      )
      expect(checkPartOption('memory', bareKit, listedKit)).toEqual(compatible)
      expect(checkPartOption('motherboard', motherboard, listedKit)).toEqual(
        compatible,
      )
    })

    it('marks only the capacity figure that is listed and fails', () => {
      const motherboard = {
        ...board('AM5', 'Compact board', 'DDR5', 1, 2, 'ATX', 2, 64),
        maxMemoryGb: undefined,
      } as unknown as Motherboard
      const memory = kit('DDR5', 'Four sticks', 4, 32)

      expect(
        checkPartOption('memory', memory, selected({ motherboard })),
      ).toEqual({ compatible: false, conflicts: ['2 DIMM slots'] })
      expect(
        checkPartOption('motherboard', motherboard, selected({ memory })),
      ).toEqual({ compatible: false, conflicts: ['4 modules'] })
    })

    it('skips the processor and memory checks until a motherboard is selected', () => {
      expect(checkPartOption('cpu', cpu('LGA1851'), selected())).toEqual(
        compatible,
      )
      expect(checkPartOption('memory', kit('DDR4'), selected())).toEqual(
        compatible,
      )
    })
  })
})
