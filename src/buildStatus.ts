import type {
  ClearanceCheck,
  CoolerSocketCheck,
  Cpu,
  FormFactorCheck,
  GpuConnectorCheck,
  PsuFormFactorCheck,
  MemoryCapacityCheck,
  MemoryCheck,
  Motherboard,
  PowerCheck,
  SocketCheck,
  StorageCheck,
} from './compatibility.ts'

export type BuildStatusLevel = 'start' | 'ok' | 'issue'

export type BuildStatusSummary = {
  level: BuildStatusLevel
  text: string
}

export type BuildStatusSelection = {
  cpu: Cpu | null
  motherboard: Motherboard | null
}

export type BuildStatusChecks = {
  socket: SocketCheck | null
  memory: MemoryCheck | null
  memoryCapacity: MemoryCapacityCheck | null
  power: PowerCheck | null
  clearance: ClearanceCheck | null
  storage: StorageCheck | null
  formFactor: FormFactorCheck | null
  coolerSocket: CoolerSocketCheck | null
  gpuConnectors: GpuConnectorCheck | null
  psuFormFactor: PsuFormFactorCheck | null
}

// Hard conflicts only. A tight supply, a part that is not selected yet, a
// form factor the parts do not list, memory size the parts do not list,
// cooler sockets the parts do not list, power connectors the parts do
// not list, and a power supply size the parts do not list stay on the
// detail lines and do not count as compatibility issues.
const compatibilityIssueCodes = new Set<string>([
  'socket-mismatch',
  'memory-mismatch',
  'memory-too-many-modules',
  'memory-over-capacity',
  'psu-insufficient',
  'gpu-too-long',
  'cooler-too-tall',
  'storage-unsupported',
  'form-factor-unsupported',
  'cooler-socket-unsupported',
  'gpu-connectors-insufficient',
  'psu-form-factor-unsupported',
])

export function buildStatusSummary(
  selection: BuildStatusSelection,
  checks: BuildStatusChecks,
): BuildStatusSummary {
  if (selection.cpu == null || selection.motherboard == null) {
    return {
      level: 'start',
      text: 'Pick a CPU and motherboard to start',
    }
  }

  const count = countCompatibilityIssues(checks)
  if (count === 0) {
    return { level: 'ok', text: 'All checks pass' }
  }

  const noun = count === 1 ? 'issue' : 'issues'
  return { level: 'issue', text: `${count} compatibility ${noun}` }
}

function countCompatibilityIssues(checks: BuildStatusChecks): number {
  const groups = [
    checks.socket?.issues,
    checks.memory?.issues,
    checks.memoryCapacity?.issues,
    checks.power?.issues,
    checks.clearance?.issues,
    checks.storage?.issues,
    checks.formFactor?.issues,
    checks.coolerSocket?.issues,
    checks.gpuConnectors?.issues,
    checks.psuFormFactor?.issues,
  ]

  let count = 0
  for (const issues of groups) {
    if (!issues) continue
    for (const issue of issues) {
      if (compatibilityIssueCodes.has(issue.code)) count += 1
    }
  }
  return count
}
