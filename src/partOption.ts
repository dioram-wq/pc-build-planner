import {
  checkCaseClearance,
  checkCoolerSocket,
  checkCpuSocket,
  checkGpuPowerConnectors,
  checkMemoryCapacity,
  checkMemoryType,
  checkMotherboardFormFactor,
  checkPowerSupply,
  checkPsuFormFactor,
  checkStorageInterface,
  formatDimmSlots,
  formatFormFactorList,
  formatModuleCount,
  formatPsuFormFactorList,
  formatRequiredPowerConnectors,
  formatSocketList,
  formatSuppliedPowerConnectors,
  type Case,
  type Cpu,
  type CpuCooler,
  type Gpu,
  type Memory,
  type Motherboard,
  type Psu,
  type StorageDrive,
} from './compatibility.ts'

export type SelectedBuild = {
  cpu: Cpu | null
  motherboard: Motherboard | null
  memory: Memory | null
  gpu: Gpu | null
  cooler: CpuCooler | null
  case: Case | null
  psu: Psu | null
  storage: StorageDrive | null
}

export type PartOptionCheck = {
  compatible: boolean
  conflicts: readonly string[]
}

type PartCandidate =
  | Cpu
  | Motherboard
  | Memory
  | Gpu
  | CpuCooler
  | Case
  | Psu
  | StorageDrive

export function formatIncompatibleOption(conflicts: readonly string[]): string {
  if (conflicts.length === 0) return ''
  return ` — incompatible: ${conflicts.join(', ')}`
}

export function checkPartOption(
  slot: 'cpu',
  candidate: Cpu,
  build: SelectedBuild,
): PartOptionCheck
export function checkPartOption(
  slot: 'motherboard',
  candidate: Motherboard,
  build: SelectedBuild,
): PartOptionCheck
export function checkPartOption(
  slot: 'memory',
  candidate: Memory,
  build: SelectedBuild,
): PartOptionCheck
export function checkPartOption(
  slot: 'gpu',
  candidate: Gpu,
  build: SelectedBuild,
): PartOptionCheck
export function checkPartOption(
  slot: 'cooler',
  candidate: CpuCooler,
  build: SelectedBuild,
): PartOptionCheck
export function checkPartOption(
  slot: 'case',
  candidate: Case,
  build: SelectedBuild,
): PartOptionCheck
export function checkPartOption(
  slot: 'psu',
  candidate: Psu,
  build: SelectedBuild,
): PartOptionCheck
export function checkPartOption(
  slot: 'storage',
  candidate: StorageDrive,
  build: SelectedBuild,
): PartOptionCheck
export function checkPartOption(
  slot:
    | 'cpu'
    | 'motherboard'
    | 'memory'
    | 'gpu'
    | 'cooler'
    | 'case'
    | 'psu'
    | 'storage',
  candidate: PartCandidate,
  build: SelectedBuild,
): PartOptionCheck {
  switch (slot) {
    case 'cpu':
      return cpuConflicts(candidate as Cpu, build)
    case 'motherboard':
      return motherboardConflicts(candidate as Motherboard, build)
    case 'memory':
      return memoryConflicts(candidate as Memory, build)
    case 'gpu':
      return gpuConflicts(candidate as Gpu, build)
    case 'cooler':
      return coolerConflicts(candidate as CpuCooler, build)
    case 'case':
      return caseConflicts(candidate as Case, build)
    case 'psu':
      return psuConflicts(candidate as Psu, build)
    case 'storage':
      return storageConflicts(candidate as StorageDrive, build)
    default: {
      const unexpected: never = slot
      throw new Error(`Unknown part slot: ${String(unexpected)}`)
    }
  }
}

function optionResult(conflicts: string[]): PartOptionCheck {
  if (conflicts.length === 0) {
    return { compatible: true, conflicts: [] }
  }

  return { compatible: false, conflicts }
}

function cpuConflicts(candidate: Cpu, build: SelectedBuild): PartOptionCheck {
  const conflicts: string[] = []

  if (
    build.motherboard &&
    !checkCpuSocket(candidate, build.motherboard).compatible
  ) {
    conflicts.push(`socket ${build.motherboard.socket}`)
  }

  if (build.cooler) {
    const cooler = cpuCoolerSocketConflict(candidate, build.cooler)
    if (cooler) conflicts.push(cooler)
  }

  return optionResult(conflicts)
}

function motherboardConflicts(
  candidate: Motherboard,
  build: SelectedBuild,
): PartOptionCheck {
  const conflicts: string[] = []

  if (build.cpu && !checkCpuSocket(build.cpu, candidate).compatible) {
    conflicts.push(`socket ${build.cpu.socket}`)
  }

  if (build.memory && !checkMemoryType(build.memory, candidate).compatible) {
    conflicts.push(`memory ${build.memory.memoryType}`)
  }

  if (build.memory) {
    conflicts.push(...boardCapacityConflicts(candidate, build.memory))
  }

  if (build.storage) {
    const storage = storageSlotConflict(build.storage, candidate)
    if (storage) conflicts.push(storage)
  }

  if (build.case) {
    const formFactor = motherboardFormFactorConflict(candidate, build.case)
    if (formFactor) conflicts.push(formFactor)
  }

  return optionResult(conflicts)
}

function memoryConflicts(
  candidate: Memory,
  build: SelectedBuild,
): PartOptionCheck {
  if (!build.motherboard) return optionResult([])

  const conflicts: string[] = []
  if (!checkMemoryType(candidate, build.motherboard).compatible) {
    conflicts.push(`memory ${build.motherboard.memoryType}`)
  }
  conflicts.push(...kitCapacityConflicts(candidate, build.motherboard))

  return optionResult(conflicts)
}

function gpuConflicts(candidate: Gpu, build: SelectedBuild): PartOptionCheck {
  const conflicts: string[] = []

  if (build.case) {
    const clearance = checkCaseClearance(build.case, candidate, null)
    if (clearance.gpuLength === 'too-long') {
      conflicts.push(`${build.case.maxGpuLengthMm}mm GPU limit`)
    }
  }

  if (build.psu) {
    const connectors = gpuConnectorConflict(candidate, build.psu)
    if (connectors) conflicts.push(connectors)
  }

  return optionResult(conflicts)
}

function coolerConflicts(
  candidate: CpuCooler,
  build: SelectedBuild,
): PartOptionCheck {
  const conflicts: string[] = []

  if (build.cpu) {
    const socket = coolerSocketConflict(candidate, build.cpu)
    if (socket) conflicts.push(socket)
  }

  if (build.case) {
    const clearance = checkCaseClearance(build.case, null, candidate)
    if (clearance.coolerHeight === 'too-tall') {
      conflicts.push(`${build.case.maxCoolerHeightMm}mm cooler limit`)
    }
  }

  return optionResult(conflicts)
}

function caseConflicts(candidate: Case, build: SelectedBuild): PartOptionCheck {
  const clearance = checkCaseClearance(candidate, build.gpu, build.cooler)
  const conflicts: string[] = []

  if (build.motherboard) {
    const formFactor = caseFormFactorConflict(candidate, build.motherboard)
    if (formFactor) conflicts.push(formFactor)
  }

  if (build.psu) {
    const psuSize = casePsuFormFactorConflict(candidate, build.psu)
    if (psuSize) conflicts.push(psuSize)
  }

  if (clearance.gpuLength === 'too-long' && build.gpu) {
    conflicts.push(`${build.gpu.lengthMm}mm GPU`)
  }

  if (clearance.coolerHeight === 'too-tall' && build.cooler) {
    conflicts.push(`${build.cooler.heightMm}mm cooler`)
  }

  return optionResult(conflicts)
}

function psuConflicts(candidate: Psu, build: SelectedBuild): PartOptionCheck {
  const conflicts: string[] = []

  if (build.cpu) {
    const power = checkPowerSupply(build.cpu, build.gpu, candidate)
    if (power.status === 'insufficient') {
      conflicts.push(`below ${power.estimatedDrawWatts}W`)
    }
  }

  if (build.gpu) {
    const connectors = psuConnectorConflict(build.gpu, candidate)
    if (connectors) conflicts.push(connectors)
  }

  if (build.case) {
    const size = psuFormFactorConflict(candidate, build.case)
    if (size) conflicts.push(size)
  }

  return optionResult(conflicts)
}

function storageConflicts(
  candidate: StorageDrive,
  build: SelectedBuild,
): PartOptionCheck {
  if (!build.motherboard) return optionResult([])

  const storage = storageSlotConflict(candidate, build.motherboard)
  return optionResult(storage ? [storage] : [])
}

function kitCapacityConflicts(kit: Memory, board: Motherboard): string[] {
  const result = checkMemoryCapacity(kit, board)
  const conflicts: string[] = []

  if (result.moduleCount === 'too-many' && typeof board.dimmSlots === 'number') {
    conflicts.push(formatDimmSlots(board.dimmSlots))
  }

  if (result.capacity === 'over' && typeof board.maxMemoryGb === 'number') {
    conflicts.push(`${board.maxMemoryGb}GB memory limit`)
  }

  return conflicts
}

function boardCapacityConflicts(board: Motherboard, kit: Memory): string[] {
  const result = checkMemoryCapacity(kit, board)
  const conflicts: string[] = []

  if (result.moduleCount === 'too-many' && typeof kit.modules === 'number') {
    conflicts.push(formatModuleCount(kit.modules))
  }

  if (result.capacity === 'over' && typeof kit.capacityGb === 'number') {
    conflicts.push(`${kit.capacityGb}GB memory`)
  }

  return conflicts
}

function motherboardFormFactorConflict(
  motherboard: Motherboard,
  pcCase: Case,
): string | null {
  const result = checkMotherboardFormFactor(motherboard, pcCase)
  if (result.status !== 'unsupported') return null

  return `case supports ${formatFormFactorList(pcCase.supportedFormFactors)}`
}

function caseFormFactorConflict(
  pcCase: Case,
  motherboard: Motherboard,
): string | null {
  const result = checkMotherboardFormFactor(motherboard, pcCase)
  if (result.status !== 'unsupported' || !motherboard.formFactor) return null

  return `${motherboard.formFactor} motherboard`
}

function psuFormFactorConflict(psu: Psu, pcCase: Case): string | null {
  const result = checkPsuFormFactor(psu, pcCase)
  if (result.status !== 'unsupported') return null

  return `case supports ${formatPsuFormFactorList(pcCase.supportedPsuFormFactors)} PSU`
}

function casePsuFormFactorConflict(pcCase: Case, psu: Psu): string | null {
  const result = checkPsuFormFactor(psu, pcCase)
  if (result.status !== 'unsupported' || !psu.formFactor) return null

  return `${psu.formFactor} power supply`
}

function coolerSocketConflict(cooler: CpuCooler, cpu: Cpu): string | null {
  const result = checkCoolerSocket(cooler, cpu)
  if (result.status !== 'unsupported') return null

  return `socket ${cpu.socket}`
}

function cpuCoolerSocketConflict(cpu: Cpu, cooler: CpuCooler): string | null {
  const result = checkCoolerSocket(cooler, cpu)
  if (result.status !== 'unsupported') return null

  return `cooler supports ${formatSocketList(cooler.sockets)}`
}

function gpuConnectorConflict(gpu: Gpu, psu: Psu): string | null {
  const result = checkGpuPowerConnectors(gpu, psu)
  if (result.status !== 'unsupported') return null
  return `supply has ${formatSuppliedPowerConnectors(psu.powerConnectors)}`
}

function psuConnectorConflict(gpu: Gpu, psu: Psu): string | null {
  const result = checkGpuPowerConnectors(gpu, psu)
  if (result.status !== 'unsupported') return null
  return `GPU needs ${formatRequiredPowerConnectors(gpu.powerConnectors)}`
}

function storageSlotConflict(
  drive: StorageDrive,
  motherboard: Motherboard,
): string | null {
  const storage = checkStorageInterface(drive, motherboard)
  if (storage.status !== 'unsupported') return null

  return drive.interface === 'M.2 NVMe' ? 'no M.2 slots' : 'no SATA ports'
}
