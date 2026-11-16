export const buildSlots = [
  'cpu',
  'motherboard',
  'memory',
  'gpu',
  'cooler',
  'case',
  'psu',
  'storage',
] as const

export type BuildSlot = (typeof buildSlots)[number]

export type BuildSelection = Record<BuildSlot, string>

export type BuildCatalog = Record<BuildSlot, readonly string[]>

// Short keys keep a shared link compact: h is the cooler, e is the case, and d is the drive.
const slotQueryKey: Record<BuildSlot, string> = {
  cpu: 'c',
  motherboard: 'b',
  memory: 'm',
  gpu: 'g',
  cooler: 'h',
  case: 'e',
  psu: 'p',
  storage: 'd',
}

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function emptyBuild(): BuildSelection {
  return {
    cpu: '',
    motherboard: '',
    memory: '',
    gpu: '',
    cooler: '',
    case: '',
    psu: '',
    storage: '',
  }
}

export function isEmptyBuild(selection: BuildSelection): boolean {
  return buildSlots.every((slot) => selection[slot] === '')
}

export function encodeBuild(selection: BuildSelection): string {
  const params = new URLSearchParams()

  for (const slot of buildSlots) {
    const id = selection[slot].trim()
    if (!idPattern.test(id)) continue
    params.set(slotQueryKey[slot], id)
  }

  return params.toString()
}

export function decodeBuild(input: unknown, catalog: BuildCatalog): BuildSelection {
  const selection = emptyBuild()
  const query = queryText(input)
  if (query === null) return selection

  const params = new URLSearchParams(query)

  for (const slot of buildSlots) {
    for (const raw of params.getAll(slotQueryKey[slot])) {
      const id = raw.trim()
      if (catalog[slot].includes(id)) {
        selection[slot] = id
        break
      }
    }
  }

  return selection
}

function queryText(input: unknown): string | null {
  if (typeof input !== 'string') return null

  const trimmed = input.trim()
  if (!trimmed) return ''

  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      if (url.search.length > 1) return url.search.slice(1)
      if (url.hash.length > 1) return url.hash.slice(1)
      return ''
    } catch {
      return null
    }
  }

  const question = trimmed.indexOf('?')
  if (question !== -1) {
    const after = trimmed.slice(question + 1)
    const hash = after.indexOf('#')
    return hash === -1 ? after : after.slice(0, hash)
  }

  const hash = trimmed.indexOf('#')
  if (hash !== -1) return trimmed.slice(hash + 1)
  return trimmed
}
