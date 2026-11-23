import type {
  ClearanceCheck,
  Cpu,
  FormFactorCheck,
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
  power: PowerCheck | null
  clearance: ClearanceCheck | null
  storage: StorageCheck | null
  formFactor: FormFactorCheck | null
}

// Hard conflicts only. A tight supply, a part that is not selected yet, and a
// form factor the parts do not list stay on the detail lines and do not count
// as compatibility issues.
const compatibilityIssueCodes = new Set<string>([
  'socket-mismatch',
  'memory-mismatch',
  'psu-insufficient',
  'gpu-too-long',
  'cooler-too-tall',
  'storage-unsupported',
  'form-factor-unsupported',
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
    checks.power?.issues,
    checks.clearance?.issues,
    checks.storage?.issues,
    checks.formFactor?.issues,
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
