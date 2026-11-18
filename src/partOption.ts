import {
  checkCaseClearance,
  checkCpuSocket,
  checkMemoryType,
  checkPowerSupply,
  checkStorageInterface,
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
  if (!build.motherboard) return optionResult([])

  const socket = checkCpuSocket(candidate, build.motherboard)
  if (socket.compatible) return optionResult([])

  return optionResult([`socket ${build.motherboard.socket}`])
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

  if (build.storage) {
    const storage = storageSlotConflict(build.storage, candidate)
    if (storage) conflicts.push(storage)
  }

  return optionResult(conflicts)
}

function memoryConflicts(
  candidate: Memory,
  build: SelectedBuild,
): PartOptionCheck {
  if (!build.motherboard) return optionResult([])

  const memory = checkMemoryType(candidate, build.motherboard)
  if (memory.compatible) return optionResult([])

  return optionResult([`memory ${build.motherboard.memoryType}`])
}

function gpuConflicts(candidate: Gpu, build: SelectedBuild): PartOptionCheck {
  if (!build.case) return optionResult([])

  const clearance = checkCaseClearance(build.case, candidate, null)
  if (clearance.gpuLength !== 'too-long') return optionResult([])

  return optionResult([`${build.case.maxGpuLengthMm}mm GPU limit`])
}

function coolerConflicts(
  candidate: CpuCooler,
  build: SelectedBuild,
): PartOptionCheck {
  if (!build.case) return optionResult([])

  const clearance = checkCaseClearance(build.case, null, candidate)
  if (clearance.coolerHeight !== 'too-tall') return optionResult([])

  return optionResult([`${build.case.maxCoolerHeightMm}mm cooler limit`])
}

function caseConflicts(candidate: Case, build: SelectedBuild): PartOptionCheck {
  const clearance = checkCaseClearance(candidate, build.gpu, build.cooler)
  const conflicts: string[] = []

  if (clearance.gpuLength === 'too-long' && build.gpu) {
    conflicts.push(`${build.gpu.lengthMm}mm GPU`)
  }

  if (clearance.coolerHeight === 'too-tall' && build.cooler) {
    conflicts.push(`${build.cooler.heightMm}mm cooler`)
  }

  return optionResult(conflicts)
}

function psuConflicts(candidate: Psu, build: SelectedBuild): PartOptionCheck {
  if (!build.cpu) return optionResult([])

  const power = checkPowerSupply(build.cpu, build.gpu, candidate)
  if (power.status !== 'insufficient') return optionResult([])

  return optionResult([`below ${power.estimatedDrawWatts}W`])
}

function storageConflicts(
  candidate: StorageDrive,
  build: SelectedBuild,
): PartOptionCheck {
  if (!build.motherboard) return optionResult([])

  const storage = storageSlotConflict(candidate, build.motherboard)
  return optionResult(storage ? [storage] : [])
}

function storageSlotConflict(
  drive: StorageDrive,
  motherboard: Motherboard,
): string | null {
  const storage = checkStorageInterface(drive, motherboard)
  if (storage.status !== 'unsupported') return null

  return drive.interface === 'M.2 NVMe' ? 'no M.2 slots' : 'no SATA ports'
}
