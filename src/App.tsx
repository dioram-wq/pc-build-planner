import { useState } from 'react'
import {
  checkCaseClearance,
  checkCpuSocket,
  checkMemoryType,
  checkPowerSupply,
  type Case,
  type Cpu,
  type CpuCooler,
  type Gpu,
  type Memory,
  type Motherboard,
  type Psu,
} from './compatibility.ts'
import {
  cases,
  coolers,
  cpus,
  gpus,
  memory,
  motherboards,
  psus,
} from './parts.ts'
import { formatUsd, totalPriceUsd } from './price.ts'

function findPart<T extends { id: string }>(parts: readonly T[], id: string): T {
  const part = parts.find((item) => item.id === id)
  if (!part) {
    throw new Error(`Unknown part id: ${id}`)
  }
  return part
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

export default function App() {
  const [cpuId, setCpuId] = useState<string>(cpus[0].id)
  const [motherboardId, setMotherboardId] = useState<string>(motherboards[0].id)
  const [memoryId, setMemoryId] = useState<string>(memory[0].id)
  const [gpuId, setGpuId] = useState<string>(gpus[0].id)
  const [coolerId, setCoolerId] = useState<string>(coolers[0].id)
  const [caseId, setCaseId] = useState<string>(cases[0].id)
  const [psuId, setPsuId] = useState<string>(psus[0].id)
  const cpu = findPart(cpus, cpuId)
  const motherboard = findPart(motherboards, motherboardId)
  const selectedMemory = findPart(memory, memoryId)
  const gpu = gpuId ? findPart(gpus, gpuId) : null
  const cooler = coolerId ? findPart(coolers, coolerId) : null
  const pcCase = caseId ? findPart(cases, caseId) : null
  const psu = psuId ? findPart(psus, psuId) : null
  const totalUsd = totalPriceUsd([
    cpu,
    motherboard,
    selectedMemory,
    gpu,
    cooler,
    pcCase,
    psu,
  ])

  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">Parts desk</p>
        <h1>PC Build Planner</h1>
        <p className="lede">
          Choose a processor, a motherboard, memory, a graphics card, a CPU
          cooler, a case, and a power supply. The planner checks that the CPU
          socket and the memory type match the board, that the supply covers
          the estimated draw, and that the cooler and graphics card fit the
          case. Sample prices for the selected parts are totaled below.
        </p>
      </header>

      <section className="panel" aria-labelledby="build-heading">
        <h2 id="build-heading">Build</h2>
        <div className="fields">
          <div className="field">
            <label htmlFor="cpu">CPU</label>
            <select
              id="cpu"
              value={cpuId}
              onChange={(event) => {
                setCpuId(event.target.value)
              }}
            >
              {cpus.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name} · {part.socket} · {formatUsd(part.priceUsd)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="motherboard">Motherboard</label>
            <select
              id="motherboard"
              value={motherboardId}
              onChange={(event) => {
                setMotherboardId(event.target.value)
              }}
            >
              {motherboards.map((part) => (
                <option key={part.id} value={part.id}>
                  {`${part.name} · ${part.socket} · ${part.memoryType} · ${formatUsd(part.priceUsd)}`}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="memory">Memory</label>
            <select
              id="memory"
              value={memoryId}
              onChange={(event) => {
                setMemoryId(event.target.value)
              }}
            >
              {memory.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name} · {part.memoryType} · {formatUsd(part.priceUsd)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="gpu">Graphics card</label>
            <select
              id="gpu"
              value={gpuId}
              onChange={(event) => {
                setGpuId(event.target.value)
              }}
            >
              <option value="">Integrated graphics</option>
              {gpus.map((part) => (
                <option key={part.id} value={part.id}>
                  {`${part.name} · ${part.boardPowerWatts}W · ${part.lengthMm}mm · ${formatUsd(part.priceUsd)}`}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cooler">CPU cooler</label>
            <select
              id="cooler"
              value={coolerId}
              onChange={(event) => {
                setCoolerId(event.target.value)
              }}
            >
              <option value="">No CPU cooler</option>
              {coolers.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name} · {part.heightMm}mm · {formatUsd(part.priceUsd)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="case">Case</label>
            <select
              id="case"
              value={caseId}
              onChange={(event) => {
                setCaseId(event.target.value)
              }}
            >
              <option value="">No case</option>
              {cases.map((part) => (
                <option key={part.id} value={part.id}>
                  {`${part.name} · ${part.maxGpuLengthMm}mm GPU · ${part.maxCoolerHeightMm}mm cooler · ${formatUsd(part.priceUsd)}`}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="psu">Power supply</label>
            <select
              id="psu"
              value={psuId}
              onChange={(event) => {
                setPsuId(event.target.value)
              }}
            >
              <option value="">No power supply</option>
              {psus.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name} · {part.wattage}W · {formatUsd(part.priceUsd)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="total" role="status">
          {`Total ${formatUsd(totalUsd)}`}
        </p>
        <SocketStatus cpu={cpu} motherboard={motherboard} />
        <MemoryStatus memory={selectedMemory} motherboard={motherboard} />
        <PowerSupplyStatus cpu={cpu} gpu={gpu} psu={psu} />
        <ClearanceStatus pcCase={pcCase} gpu={gpu} cooler={cooler} />
      </section>
    </main>
  )
}
