import { useEffect, useState } from 'react'
import {
  buildStatusSummary,
  type BuildStatusSummary,
} from './buildStatus.ts'
import {
  checkCaseClearance,
  checkCpuSocket,
  checkMemoryCapacity,
  checkMemoryType,
  checkMotherboardFormFactor,
  checkPowerSupply,
  checkStorageInterface,
  formatDimmSlots,
  formatFormFactorList,
  formatModuleCount,
  type Case,
  type Cpu,
  type CpuCooler,
  type Gpu,
  type Memory,
  type Motherboard,
  type Psu,
  type StorageDrive,
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
import {
  checkPartOption,
  formatIncompatibleOption,
  type SelectedBuild,
} from './partOption.ts'
import {
  buildPriceBreakdown,
  formatUsd,
  totalPriceUsd,
  type PriceBreakdownSlot,
} from './price.ts'
import {
  decodeBuild,
  encodeBuild,
  isEmptyBuild,
  type BuildCatalog,
  type BuildSelection,
} from './share/buildUrl.ts'

function storageSlotSummary(
  drive: StorageDrive,
  motherboard: Motherboard,
): string {
  if (drive.interface === 'M.2 NVMe') {
    const count = motherboard.m2Slots
    return `${count} M.2 ${count === 1 ? 'slot' : 'slots'}`
  }

  const count = motherboard.sataPorts
  return `${count} SATA ${count === 1 ? 'port' : 'ports'}`
}

function partIds<T extends { id: string }>(
  parts: readonly T[],
): readonly string[] {
  return parts.map((part) => part.id)
}

const buildCatalog: BuildCatalog = {
  cpu: partIds(cpus),
  motherboard: partIds(motherboards),
  memory: partIds(memory),
  gpu: partIds(gpus),
  cooler: partIds(coolers),
  case: partIds(cases),
  psu: partIds(psus),
  storage: partIds(storage),
}

const defaultBuild: BuildSelection = {
  cpu: cpus[0].id,
  motherboard: motherboards[0].id,
  memory: memory[0].id,
  gpu: gpus[0].id,
  cooler: coolers[0].id,
  case: cases[0].id,
  psu: psus[0].id,
  storage: storage[0].id,
}

function locationSource(): string {
  if (window.location.search.length > 1) return window.location.search
  if (window.location.hash.length > 1) return window.location.hash
  return ''
}

function selectionFromLocation(): BuildSelection {
  const source = locationSource()
  if (!source) return defaultBuild

  const decoded = decodeBuild(source, buildCatalog)
  if (isEmptyBuild(decoded)) return defaultBuild

  return {
    cpu: decoded.cpu || defaultBuild.cpu,
    motherboard: decoded.motherboard || defaultBuild.motherboard,
    memory: decoded.memory || defaultBuild.memory,
    gpu: decoded.gpu,
    cooler: decoded.cooler,
    case: decoded.case,
    psu: decoded.psu,
    storage: decoded.storage,
  }
}

function findPart<T extends { id: string }>(parts: readonly T[], id: string): T {
  const part = parts.find((item) => item.id === id)
  if (!part) {
    throw new Error(`Unknown part id: ${id}`)
  }
  return part
}

function BuildSummary({ summary }: { summary: BuildStatusSummary }) {
  let tone = 'missing'
  if (summary.level === 'ok') tone = 'ok'
  if (summary.level === 'issue') tone = 'bad'

  return (
    <p
      className={`build-summary status ${tone}`}
      role="status"
      aria-label={`Build status: ${summary.text}`}
    >
      {summary.text}
    </p>
  )
}

function SocketStatus({
  cpu,
  motherboard,
}: {
  cpu: Cpu
  motherboard: Motherboard
}) {
  const result = checkCpuSocket(cpu, motherboard)

  if (result.compatible) {
    return (
      <p className="status ok" role="status">
        Compatible. Both parts use {cpu.socket}.
      </p>
    )
  }

  return (
    <div className="status bad" role="status">
      <p>Incompatible.</p>
      <ul>
        {result.issues.map((issue) => (
          <li key={issue.code}>{issue.message}</li>
        ))}
      </ul>
    </div>
  )
}

function MemoryStatus({
  memory,
  motherboard,
}: {
  memory: Memory
  motherboard: Motherboard
}) {
  const result = checkMemoryType(memory, motherboard)

  if (result.compatible) {
    return (
      <p className="status ok" role="status">
        Compatible. Both parts use {memory.memoryType}.
      </p>
    )
  }

  return (
    <div className="status bad" role="status">
      <p>Incompatible.</p>
      <ul>
        {result.issues.map((issue) => (
          <li key={issue.code}>{issue.message}</li>
        ))}
      </ul>
    </div>
  )
}

function MemoryCapacityStatus({
  memory,
  motherboard,
}: {
  memory: Memory
  motherboard: Motherboard
}) {
  const result = checkMemoryCapacity(memory, motherboard)

  if (result.status === 'ok') {
    return (
      <p className="status ok" role="status">
        {`Compatible. ${memory.name} (${formatModuleCount(memory.modules)}, ${memory.capacityGb}GB) fits ${motherboard.name} (${formatDimmSlots(motherboard.dimmSlots)}, ${motherboard.maxMemoryGb}GB).`}
      </p>
    )
  }

  let heading = 'Memory capacity unknown.'
  let tone = 'missing'
  if (result.moduleCount === 'too-many' && result.capacity === 'over') {
    heading = 'Does not fit.'
    tone = 'bad'
  } else if (result.moduleCount === 'too-many') {
    heading = 'Too many modules.'
    tone = 'bad'
  } else if (result.capacity === 'over') {
    heading = 'Over the memory limit.'
    tone = 'bad'
  }

  return (
    <div className={`status ${tone}`} role="status">
      <p>{heading}</p>
      <ul>
        {result.issues.map((issue) => (
          <li key={issue.code}>{issue.message}</li>
        ))}
      </ul>
    </div>
  )
}

function PowerSupplyStatus({
  cpu,
  gpu,
  psu,
}: {
  cpu: Cpu
  gpu: Gpu | null
  psu: Psu | null
}) {
  const result = checkPowerSupply(cpu, gpu, psu)

  if (result.status === 'ok' && psu) {
    return (
      <p className="status ok" role="status">
        {`Estimated draw is ${result.estimatedDrawWatts}W. ${psu.name} (${psu.wattage}W) meets the ${result.recommendedWatts}W recommendation.`}
      </p>
    )
  }

  let heading = 'No power supply selected.'
  let tone = 'missing'
  if (result.status === 'tight') {
    heading = 'Tight.'
    tone = 'tight'
  } else if (result.status === 'insufficient') {
    heading = 'Insufficient.'
    tone = 'bad'
  }

  return (
    <div className={`status ${tone}`} role="status">
      <p>{heading}</p>
      <ul>
        {result.issues.map((issue) => (
          <li key={issue.code}>{issue.message}</li>
        ))}
      </ul>
    </div>
  )
}

function FormFactorStatus({
  motherboard,
  pcCase,
}: {
  motherboard: Motherboard
  pcCase: Case | null
}) {
  const result = checkMotherboardFormFactor(motherboard, pcCase)

  if (result.status === 'ok' && pcCase) {
    return (
      <p className="status ok" role="status">
        {`Compatible. ${motherboard.name} (${motherboard.formFactor}) fits ${pcCase.name} (${formatFormFactorList(pcCase.supportedFormFactors)}).`}
      </p>
    )
  }

  let heading = 'No case selected.'
  let tone = 'missing'
  if (result.status === 'unsupported') {
    heading = 'Board does not fit.'
    tone = 'bad'
  } else if (pcCase) {
    heading = 'Form factor unknown.'
  }

  return (
    <div className={`status ${tone}`} role="status">
      <p>{heading}</p>
      <ul>
        {result.issues.map((issue) => (
          <li key={issue.code}>{issue.message}</li>
        ))}
      </ul>
    </div>
  )
}

function ClearanceStatus({
  pcCase,
  gpu,
  cooler,
}: {
  pcCase: Case | null
  gpu: Gpu | null
  cooler: CpuCooler | null
}) {
  const result = checkCaseClearance(pcCase, gpu, cooler)
  const fits =
    result.issues.length === 0 &&
    (result.gpuLength === 'ok' || result.coolerHeight === 'ok')

  if (fits && pcCase) {
    const sentences: string[] = []
    if (result.gpuLength === 'ok' && gpu) {
      sentences.push(
        `${gpu.name} (${gpu.lengthMm}mm) fits ${pcCase.name} (${pcCase.maxGpuLengthMm}mm).`,
      )
    }
    if (result.coolerHeight === 'ok' && cooler) {
      sentences.push(
        `${cooler.name} (${cooler.heightMm}mm) fits the ${pcCase.maxCoolerHeightMm}mm cooler limit.`,
      )
    }

    return (
      <p className="status ok" role="status">
        {sentences.join(' ')}
      </p>
    )
  }

  if (result.issues.length === 0 && pcCase) {
    return (
      <div className="status missing" role="status">
        <p>Nothing selected to check.</p>
        <ul>
          <li>
            {`Select a graphics card or a CPU cooler to check clearance in ${pcCase.name}.`}
          </li>
        </ul>
      </div>
    )
  }

  let heading = 'No case selected.'
  let tone = 'missing'
  if (result.gpuLength === 'too-long' && result.coolerHeight === 'too-tall') {
    heading = 'Does not fit.'
    tone = 'bad'
  } else if (result.gpuLength === 'too-long') {
    heading = 'Too long.'
    tone = 'bad'
  } else if (result.coolerHeight === 'too-tall') {
    heading = 'Too tall.'
    tone = 'bad'
  }

  return (
    <div className={`status ${tone}`} role="status">
      <p>{heading}</p>
      <ul>
        {result.issues.map((issue) => (
          <li key={issue.code}>{issue.message}</li>
        ))}
      </ul>
    </div>
  )
}

function StorageStatus({
  drive,
  motherboard,
}: {
  drive: StorageDrive | null
  motherboard: Motherboard
}) {
  const result = checkStorageInterface(drive, motherboard)

  if (result.status === 'ok' && drive) {
    return (
      <p className="status ok" role="status">
        {`Compatible. ${drive.name} (${drive.interface}) fits ${motherboard.name} (${storageSlotSummary(drive, motherboard)}).`}
      </p>
    )
  }

  let heading = 'No storage selected.'
  let tone = 'missing'
  if (result.status === 'unsupported') {
    heading = 'Unsupported.'
    tone = 'bad'
  }

  return (
    <div className={`status ${tone}`} role="status">
      <p>{heading}</p>
      <ul>
        {result.issues.map((issue) => (
          <li key={issue.code}>{issue.message}</li>
        ))}
      </ul>
    </div>
  )
}

export function PriceBreakdown({
  slots,
}: {
  slots: readonly PriceBreakdownSlot[]
}) {
  const lines = buildPriceBreakdown(slots)
  const totalUsd = totalPriceUsd(slots.map((slot) => slot.part ?? null))

  return (
    <div className="price-summary">
      <p className="total" role="status">{`Total ${formatUsd(totalUsd)}`}</p>
      {lines.length > 0 ? (
        <ul className="breakdown" aria-label="Price breakdown">
          {lines.map((line) => (
            <li key={line.category}>
              <span className="breakdown-part">{line.name}</span>
              <span className="breakdown-price">
                {line.priceUsd == null ? '—' : formatUsd(line.priceUsd)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function CatalogOption({
  id,
  label,
  conflicts,
}: {
  id: string
  label: string
  conflicts: readonly string[]
}) {
  const note = formatIncompatibleOption(conflicts)

  return (
    <option value={id} className={note ? 'incompatible' : undefined}>
      {label}
      {note}
    </option>
  )
}

export default function App() {
  const [build, setBuild] = useState(selectionFromLocation)
  const [copyNote, setCopyNote] = useState('')
  const cpu = findPart(cpus, build.cpu)
  const motherboard = findPart(motherboards, build.motherboard)
  const selectedMemory = findPart(memory, build.memory)
  const gpu = build.gpu ? findPart(gpus, build.gpu) : null
  const cooler = build.cooler ? findPart(coolers, build.cooler) : null
  const pcCase = build.case ? findPart(cases, build.case) : null
  const psu = build.psu ? findPart(psus, build.psu) : null
  const drive = build.storage ? findPart(storage, build.storage) : null
  const selected: SelectedBuild = {
    cpu,
    motherboard,
    memory: selectedMemory,
    gpu,
    cooler,
    case: pcCase,
    psu,
    storage: drive,
  }
  const summary = buildStatusSummary(
    { cpu, motherboard },
    {
      socket: checkCpuSocket(cpu, motherboard),
      memory: checkMemoryType(selectedMemory, motherboard),
      memoryCapacity: checkMemoryCapacity(selectedMemory, motherboard),
      power: checkPowerSupply(cpu, gpu, psu),
      clearance: checkCaseClearance(pcCase, gpu, cooler),
      storage: checkStorageInterface(drive, motherboard),
      formFactor: checkMotherboardFormFactor(motherboard, pcCase),
    },
  )
  const priceSlots: PriceBreakdownSlot[] = [
    { category: 'CPU', part: cpu },
    { category: 'Motherboard', part: motherboard },
    { category: 'Memory', part: selectedMemory },
    { category: 'Graphics card', part: gpu },
    { category: 'CPU cooler', part: cooler },
    { category: 'Case', part: pcCase },
    { category: 'Power supply', part: psu },
    { category: 'Storage', part: drive },
  ]

  useEffect(() => {
    const encoded = encodeBuild(build)
    const nextSearch = encoded ? `?${encoded}` : ''
    if (window.location.search === nextSearch && window.location.hash === '') {
      return
    }
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${nextSearch}`,
    )
  }, [build])

  function update(slot: keyof BuildSelection, value: string) {
    setCopyNote('')
    setBuild((current) => {
      if (current[slot] === value) return current
      return { ...current, [slot]: value }
    })
  }

  function copyLink() {
    const encoded = encodeBuild(build)
    const url = new URL(window.location.href)
    url.search = encoded
    url.hash = ''
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)

    const writeText = navigator.clipboard?.writeText
    if (!writeText) {
      setCopyNote('Could not copy the link')
      return
    }

    void writeText.call(navigator.clipboard, url.toString()).then(
      () => {
        setCopyNote('Link copied')
      },
      () => {
        setCopyNote('Could not copy the link')
      },
    )
  }

  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">Parts desk</p>
        <h1>PC Build Planner</h1>
        <p className="lede">
          Choose a processor, a motherboard, memory, a graphics card, a CPU
          cooler, a case, a power supply, and storage. The planner checks that
          the CPU socket and the memory type match the board, that the memory
          kit fits the board's slots and capacity, that the supply covers the
          estimated draw, that the case supports the motherboard form factor,
          that the cooler and graphics card fit the case, and that the
          motherboard supports the drive interface. A line
          at the top of the build counts any compatibility issues. Options
          that conflict with the parts already chosen are marked in each list
          and can still be selected. Sample prices for the selected parts are
          listed and totaled below. The address bar keeps a link to this build.
        </p>
      </header>

      <section className="panel" aria-labelledby="build-heading">
        <div className="panel-heading">
          <h2 id="build-heading">Build</h2>
          <button type="button" className="copy-link" onClick={copyLink}>
            Copy link
          </button>
        </div>
        {copyNote ? (
          <p className="copy-note" role="status">
            {copyNote}
          </p>
        ) : null}
        <BuildSummary summary={summary} />
        <div className="fields">
          <div className="field">
            <label htmlFor="cpu">CPU</label>
            <select
              id="cpu"
              value={build.cpu}
              onChange={(event) => {
                update('cpu', event.target.value)
              }}
            >
              {cpus.map((part) => (
                <CatalogOption
                  key={part.id}
                  id={part.id}
                  label={`${part.name} · ${part.socket} · ${formatUsd(part.priceUsd)}`}
                  conflicts={checkPartOption('cpu', part, selected).conflicts}
                />
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="motherboard">Motherboard</label>
            <select
              id="motherboard"
              value={build.motherboard}
              onChange={(event) => {
                update('motherboard', event.target.value)
              }}
            >
              {motherboards.map((part) => (
                <CatalogOption
                  key={part.id}
                  id={part.id}
                  label={`${part.name} · ${part.socket} · ${part.memoryType} · ${part.formFactor} · ${formatDimmSlots(part.dimmSlots)} · ${part.maxMemoryGb}GB · ${part.m2Slots} M.2 · ${part.sataPorts} SATA · ${formatUsd(part.priceUsd)}`}
                  conflicts={
                    checkPartOption('motherboard', part, selected).conflicts
                  }
                />
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="memory">Memory</label>
            <select
              id="memory"
              value={build.memory}
              onChange={(event) => {
                update('memory', event.target.value)
              }}
            >
              {memory.map((part) => (
                <CatalogOption
                  key={part.id}
                  id={part.id}
                  label={`${part.name} · ${part.memoryType} · ${formatModuleCount(part.modules)} · ${part.capacityGb}GB · ${formatUsd(part.priceUsd)}`}
                  conflicts={checkPartOption('memory', part, selected).conflicts}
                />
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="gpu">Graphics card</label>
            <select
              id="gpu"
              value={build.gpu}
              onChange={(event) => {
                update('gpu', event.target.value)
              }}
            >
              <option value="">Integrated graphics</option>
              {gpus.map((part) => (
                <CatalogOption
                  key={part.id}
                  id={part.id}
                  label={`${part.name} · ${part.boardPowerWatts}W · ${part.lengthMm}mm · ${formatUsd(part.priceUsd)}`}
                  conflicts={checkPartOption('gpu', part, selected).conflicts}
                />
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cooler">CPU cooler</label>
            <select
              id="cooler"
              value={build.cooler}
              onChange={(event) => {
                update('cooler', event.target.value)
              }}
            >
              <option value="">No CPU cooler</option>
              {coolers.map((part) => (
                <CatalogOption
                  key={part.id}
                  id={part.id}
                  label={`${part.name} · ${part.heightMm}mm · ${formatUsd(part.priceUsd)}`}
                  conflicts={checkPartOption('cooler', part, selected).conflicts}
                />
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="case">Case</label>
            <select
              id="case"
              value={build.case}
              onChange={(event) => {
                update('case', event.target.value)
              }}
            >
              <option value="">No case</option>
              {cases.map((part) => (
                <CatalogOption
                  key={part.id}
                  id={part.id}
                  label={`${part.name} · ${formatFormFactorList(part.supportedFormFactors)} · ${part.maxGpuLengthMm}mm GPU · ${part.maxCoolerHeightMm}mm cooler · ${formatUsd(part.priceUsd)}`}
                  conflicts={checkPartOption('case', part, selected).conflicts}
                />
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="psu">Power supply</label>
            <select
              id="psu"
              value={build.psu}
              onChange={(event) => {
                update('psu', event.target.value)
              }}
            >
              <option value="">No power supply</option>
              {psus.map((part) => (
                <CatalogOption
                  key={part.id}
                  id={part.id}
                  label={`${part.name} · ${part.wattage}W · ${formatUsd(part.priceUsd)}`}
                  conflicts={checkPartOption('psu', part, selected).conflicts}
                />
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="storage">Storage</label>
            <select
              id="storage"
              value={build.storage}
              onChange={(event) => {
                update('storage', event.target.value)
              }}
            >
              <option value="">No storage</option>
              {storage.map((part) => (
                <CatalogOption
                  key={part.id}
                  id={part.id}
                  label={`${part.name} · ${part.interface} · ${formatUsd(part.priceUsd)}`}
                  conflicts={checkPartOption('storage', part, selected).conflicts}
                />
              ))}
            </select>
          </div>
        </div>
        <PriceBreakdown slots={priceSlots} />
        <SocketStatus cpu={cpu} motherboard={motherboard} />
        <MemoryStatus memory={selectedMemory} motherboard={motherboard} />
        <MemoryCapacityStatus
          memory={selectedMemory}
          motherboard={motherboard}
        />
        <PowerSupplyStatus cpu={cpu} gpu={gpu} psu={psu} />
        <FormFactorStatus motherboard={motherboard} pcCase={pcCase} />
        <ClearanceStatus pcCase={pcCase} gpu={gpu} cooler={cooler} />
        <StorageStatus drive={drive} motherboard={motherboard} />
      </section>
    </main>
  )
}
