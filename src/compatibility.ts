export type CpuSocket = 'AM4' | 'AM5' | 'LGA1700' | 'LGA1851'

export type MemoryType = 'DDR4' | 'DDR5'

export type BoardFormFactor = 'ATX' | 'Micro-ATX' | 'Mini-ITX'

export type Cpu = {
  id: string
  name: string
  socket: CpuSocket
  tdpWatts: number
}

export type Motherboard = {
  id: string
  name: string
  socket: CpuSocket
  memoryType: MemoryType
  m2Slots: number
  sataPorts: number
  formFactor: BoardFormFactor
  dimmSlots: number
  maxMemoryGb: number
}

export type Memory = {
  id: string
  name: string
  memoryType: MemoryType
  modules: number
  capacityGb: number
}

export type SocketMismatch = {
  code: 'socket-mismatch'
  message: string
}

export type SocketCheck = {
  compatible: boolean
  issues: SocketMismatch[]
}

export function checkCpuSocket(cpu: Cpu, motherboard: Motherboard): SocketCheck {
  if (cpu.socket === motherboard.socket) {
    return { compatible: true, issues: [] }
  }

  return {
    compatible: false,
    issues: [
      {
        code: 'socket-mismatch',
        message: `${cpu.name} (${cpu.socket}) does not fit ${motherboard.name} (${motherboard.socket}).`,
      },
    ],
  }
}

export type MemoryMismatch = {
  code: 'memory-mismatch'
  message: string
}

export type MemoryCheck = {
  compatible: boolean
  issues: MemoryMismatch[]
}

export function checkMemoryType(
  memory: Memory,
  motherboard: Motherboard,
): MemoryCheck {
  if (memory.memoryType === motherboard.memoryType) {
    return { compatible: true, issues: [] }
  }

  return {
    compatible: false,
    issues: [
      {
        code: 'memory-mismatch',
        message: `${memory.name} (${memory.memoryType}) does not fit ${motherboard.name} (${motherboard.memoryType}).`,
      },
    ],
  }
}

export type MemoryCapacityStatus = 'ok' | 'unsupported' | 'missing'

export type MemoryModuleStatus = 'ok' | 'too-many' | 'skipped'

export type MemorySizeStatus = 'ok' | 'over' | 'skipped'

export type MemoryCapacityIssue = {
  code:
    | 'memory-too-many-modules'
    | 'memory-over-capacity'
    | 'memory-modules-missing'
    | 'memory-capacity-missing'
  message: string
}

export type MemoryCapacityCheck = {
  status: MemoryCapacityStatus
  moduleCount: MemoryModuleStatus
  capacity: MemorySizeStatus
  issues: MemoryCapacityIssue[]
}

export type MemoryCapacityKit = {
  name: string
  modules?: number | null
  capacityGb?: number | null
}

export type MemoryCapacityBoard = {
  name: string
  dimmSlots?: number | null
  maxMemoryGb?: number | null
}

export function formatModuleCount(modules: number): string {
  return `${modules} ${modules === 1 ? 'module' : 'modules'}`
}

export function formatDimmSlots(slots: number): string {
  return `${slots} ${slots === 1 ? 'DIMM slot' : 'DIMM slots'}`
}

function listedModuleCount(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    return null
  }
  return value
}

function listedDimmSlots(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return null
  }
  return value
}

function listedCapacityGb(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null
  }
  return value
}

export function checkMemoryCapacity(
  memory: MemoryCapacityKit,
  motherboard: MemoryCapacityBoard,
): MemoryCapacityCheck {
  const modules = listedModuleCount(memory.modules)
  const slots = listedDimmSlots(motherboard.dimmSlots)
  const capacityGb = listedCapacityGb(memory.capacityGb)
  const maxMemoryGb = listedCapacityGb(motherboard.maxMemoryGb)

  const issues: MemoryCapacityIssue[] = []
  let moduleCount: MemoryModuleStatus = 'skipped'
  let capacity: MemorySizeStatus = 'skipped'

  if (modules != null && slots != null) {
    if (modules > slots) {
      moduleCount = 'too-many'
      issues.push({
        code: 'memory-too-many-modules',
        message: `${memory.name} (${formatModuleCount(modules)}) does not fit ${motherboard.name} (${formatDimmSlots(slots)}).`,
      })
    } else {
      moduleCount = 'ok'
    }
  } else {
    issues.push({
      code: 'memory-modules-missing',
      message: missingModulesMessage(
        memory.name,
        motherboard.name,
        modules != null,
        slots != null,
      ),
    })
  }

  if (capacityGb != null && maxMemoryGb != null) {
    if (capacityGb > maxMemoryGb) {
      capacity = 'over'
      issues.push({
        code: 'memory-over-capacity',
        message: `${memory.name} (${capacityGb}GB) is more than ${motherboard.name} supports (${maxMemoryGb}GB).`,
      })
    } else {
      capacity = 'ok'
    }
  } else {
    issues.push({
      code: 'memory-capacity-missing',
      message: missingCapacityMessage(
        memory.name,
        motherboard.name,
        capacityGb != null,
        maxMemoryGb != null,
      ),
    })
  }

  let status: MemoryCapacityStatus = 'ok'
  if (moduleCount === 'too-many' || capacity === 'over') {
    status = 'unsupported'
  } else if (moduleCount === 'skipped' || capacity === 'skipped') {
    status = 'missing'
  }

  return { status, moduleCount, capacity, issues }
}

function missingModulesMessage(
  kitName: string,
  boardName: string,
  kitListed: boolean,
  boardListed: boolean,
): string {
  if (!kitListed && !boardListed) {
    return `${kitName} does not list a module count, and ${boardName} does not list DIMM slots.`
  }

  if (!kitListed) {
    return `${kitName} does not list a module count.`
  }

  return `${boardName} does not list DIMM slots.`
}

function missingCapacityMessage(
  kitName: string,
  boardName: string,
  kitListed: boolean,
  boardListed: boolean,
): string {
  if (!kitListed && !boardListed) {
    return `${kitName} does not list a capacity, and ${boardName} does not list a maximum memory size.`
  }

  if (!kitListed) {
    return `${kitName} does not list a capacity.`
  }

  return `${boardName} does not list a maximum memory size.`
}

export type Gpu = {
  id: string
  name: string
  boardPowerWatts: number
  lengthMm: number
}

export type CpuCooler = {
  id: string
  name: string
  heightMm: number
}

export type Case = {
  id: string
  name: string
  maxGpuLengthMm: number
  maxCoolerHeightMm: number
  supportedFormFactors: readonly BoardFormFactor[]
}

export type Psu = {
  id: string
  name: string
  wattage: number
}

export const PLATFORM_ALLOWANCE_WATTS = 100

export const RECOMMENDED_HEADROOM_RATIO = 0.25

export type PowerStatus = 'ok' | 'tight' | 'insufficient' | 'missing'

export type PowerIssue = {
  code: 'psu-tight' | 'psu-insufficient' | 'psu-missing'
  message: string
}

export type PowerCheck = {
  status: PowerStatus
  estimatedDrawWatts: number
  recommendedWatts: number
  issues: PowerIssue[]
}

function recommendedPsuWatts(estimatedDrawWatts: number): number {
  return Math.ceil(estimatedDrawWatts * (1 + RECOMMENDED_HEADROOM_RATIO))
}

export function checkPowerSupply(
  cpu: Cpu,
  gpu: Gpu | null,
  psu: Psu | null,
): PowerCheck {
  const estimatedDrawWatts =
    cpu.tdpWatts + (gpu?.boardPowerWatts ?? 0) + PLATFORM_ALLOWANCE_WATTS
  const recommendedWatts = recommendedPsuWatts(estimatedDrawWatts)

  if (!psu) {
    return {
      status: 'missing',
      estimatedDrawWatts,
      recommendedWatts,
      issues: [
        {
          code: 'psu-missing',
          message: `Select a power supply to compare against the ${estimatedDrawWatts}W estimated draw.`,
        },
      ],
    }
  }

  if (psu.wattage < estimatedDrawWatts) {
    return {
      status: 'insufficient',
      estimatedDrawWatts,
      recommendedWatts,
      issues: [
        {
          code: 'psu-insufficient',
          message: `${psu.name} (${psu.wattage}W) is below the ${estimatedDrawWatts}W estimated draw.`,
        },
      ],
    }
  }

  if (psu.wattage < recommendedWatts) {
    return {
      status: 'tight',
      estimatedDrawWatts,
      recommendedWatts,
      issues: [
        {
          code: 'psu-tight',
          message: `${psu.name} (${psu.wattage}W) covers the ${estimatedDrawWatts}W estimate but is below the ${recommendedWatts}W recommendation.`,
        },
      ],
    }
  }

  return {
    status: 'ok',
    estimatedDrawWatts,
    recommendedWatts,
    issues: [],
  }
}

export type GpuLengthStatus = 'ok' | 'too-long' | 'skipped'

export type CoolerHeightStatus = 'ok' | 'too-tall' | 'skipped'

export type ClearanceIssue = {
  code: 'gpu-too-long' | 'cooler-too-tall' | 'case-missing'
  message: string
}

export type ClearanceCheck = {
  gpuLength: GpuLengthStatus
  coolerHeight: CoolerHeightStatus
  issues: ClearanceIssue[]
}

export function checkCaseClearance(
  pcCase: Case | null,
  gpu: Gpu | null,
  cooler: CpuCooler | null,
): ClearanceCheck {
  if (!pcCase) {
    return {
      gpuLength: 'skipped',
      coolerHeight: 'skipped',
      issues: [
        {
          code: 'case-missing',
          message:
            'Select a case to check graphics card length and cooler height.',
        },
      ],
    }
  }

  const issues: ClearanceIssue[] = []
  let gpuLength: GpuLengthStatus = 'skipped'
  let coolerHeight: CoolerHeightStatus = 'skipped'

  if (gpu) {
    if (gpu.lengthMm > pcCase.maxGpuLengthMm) {
      gpuLength = 'too-long'
      issues.push({
        code: 'gpu-too-long',
        message: `${gpu.name} (${gpu.lengthMm}mm) is longer than ${pcCase.name} allows (${pcCase.maxGpuLengthMm}mm).`,
      })
    } else {
      gpuLength = 'ok'
    }
  }

  if (cooler) {
    if (cooler.heightMm > pcCase.maxCoolerHeightMm) {
      coolerHeight = 'too-tall'
      issues.push({
        code: 'cooler-too-tall',
        message: `${cooler.name} (${cooler.heightMm}mm) is taller than ${pcCase.name} allows (${pcCase.maxCoolerHeightMm}mm).`,
      })
    } else {
      coolerHeight = 'ok'
    }
  }

  return { gpuLength, coolerHeight, issues }
}

export type StorageInterface = 'M.2 NVMe' | 'SATA'

export type StorageDrive = {
  id: string
  name: string
  interface: StorageInterface
}

export type StorageStatus = 'ok' | 'unsupported' | 'missing'

export type StorageIssue = {
  code: 'storage-unsupported' | 'storage-missing'
  message: string
}

export type StorageCheck = {
  status: StorageStatus
  issues: StorageIssue[]
}

export function checkStorageInterface(
  drive: StorageDrive | null,
  motherboard: Motherboard,
): StorageCheck {
  if (!drive) {
    return {
      status: 'missing',
      issues: [
        {
          code: 'storage-missing',
          message:
            'Select a drive to check its interface against the motherboard.',
        },
      ],
    }
  }

  const slots =
    drive.interface === 'M.2 NVMe' ? motherboard.m2Slots : motherboard.sataPorts

  if (slots > 0) {
    return { status: 'ok', issues: [] }
  }

  const slotLabel = drive.interface === 'M.2 NVMe' ? 'M.2 slots' : 'SATA ports'

  return {
    status: 'unsupported',
    issues: [
      {
        code: 'storage-unsupported',
        message: `${drive.name} (${drive.interface}) does not fit ${motherboard.name} (${slots} ${slotLabel}).`,
      },
    ],
  }
}

export type FormFactorStatus = 'ok' | 'unsupported' | 'missing'

export type FormFactorIssue = {
  code: 'form-factor-unsupported' | 'form-factor-missing'
  message: string
}

export type FormFactorCheck = {
  status: FormFactorStatus
  issues: FormFactorIssue[]
}

export type FormFactorBoard = {
  name: string
  formFactor?: BoardFormFactor | null
}

export type FormFactorCase = {
  name: string
  supportedFormFactors?: readonly BoardFormFactor[] | null
}

const boardFormFactors: readonly BoardFormFactor[] = [
  'ATX',
  'Micro-ATX',
  'Mini-ITX',
]

export function formatFormFactorList(
  formFactors: readonly BoardFormFactor[],
): string {
  return formFactors.join(', ')
}

function isBoardFormFactor(value: unknown): value is BoardFormFactor {
  return boardFormFactors.some((formFactor) => formFactor === value)
}

function listedFormFactors(
  formFactors: readonly BoardFormFactor[] | null | undefined,
): BoardFormFactor[] {
  if (!formFactors) return []
  return formFactors.filter(isBoardFormFactor)
}

export function checkMotherboardFormFactor(
  motherboard: FormFactorBoard,
  pcCase: FormFactorCase | null,
): FormFactorCheck {
  if (!pcCase) {
    return {
      status: 'missing',
      issues: [
        {
          code: 'form-factor-missing',
          message: 'Select a case to check the motherboard form factor.',
        },
      ],
    }
  }

  const formFactor = isBoardFormFactor(motherboard.formFactor)
    ? motherboard.formFactor
    : null
  const supported = listedFormFactors(pcCase.supportedFormFactors)

  if (!formFactor || supported.length === 0) {
    return {
      status: 'missing',
      issues: [
        {
          code: 'form-factor-missing',
          message: missingFormFactorMessage(
            motherboard.name,
            pcCase.name,
            formFactor != null,
            supported.length > 0,
          ),
        },
      ],
    }
  }

  if (supported.includes(formFactor)) {
    return { status: 'ok', issues: [] }
  }

  return {
    status: 'unsupported',
    issues: [
      {
        code: 'form-factor-unsupported',
        message: `${motherboard.name} (${formFactor}) does not fit ${pcCase.name} (${formatFormFactorList(supported)}).`,
      },
    ],
  }
}

function missingFormFactorMessage(
  boardName: string,
  caseName: string,
  boardListed: boolean,
  caseListed: boolean,
): string {
  if (!boardListed && !caseListed) {
    return `${boardName} does not list a form factor, and ${caseName} does not list the motherboard sizes it supports.`
  }

  if (!boardListed) {
    return `${boardName} does not list a form factor.`
  }

  return `${caseName} does not list the motherboard sizes it supports.`
}
