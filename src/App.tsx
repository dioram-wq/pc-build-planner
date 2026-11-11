import { useState } from 'react'
import {
  checkCpuSocket,
  checkMemoryType,
  checkPowerSupply,
  type Cpu,
  type Gpu,
  type Memory,
  type Motherboard,
  type Psu,
} from './compatibility.ts'
import { cpus, gpus, laterChecks, memory, motherboards, psus } from './parts.ts'

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

export default function App() {
  const [cpuId, setCpuId] = useState<string>(cpus[0].id)
  const [motherboardId, setMotherboardId] = useState<string>(motherboards[0].id)
  const [memoryId, setMemoryId] = useState<string>(memory[0].id)
  const [gpuId, setGpuId] = useState<string>(gpus[0].id)
  const [psuId, setPsuId] = useState<string>(psus[0].id)
  const cpu = findPart(cpus, cpuId)
  const motherboard = findPart(motherboards, motherboardId)
  const selectedMemory = findPart(memory, memoryId)
  const gpu = gpuId ? findPart(gpus, gpuId) : null
  const psu = psuId ? findPart(psus, psuId) : null

  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">Parts desk</p>
        <h1>PC Build Planner</h1>
        <p className="lede">
          Choose a processor, a motherboard, memory, a graphics card, and a
          power supply. The planner checks that the CPU socket and the memory
          type match the board, and that the supply covers the estimated draw.
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
                  {part.name} · {part.socket}
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
                  {part.name} · {part.socket} · {part.memoryType}
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
                  {part.name} · {part.memoryType}
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
                  {part.name} · {part.boardPowerWatts}W
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
                  {part.name} · {part.wattage}W
                </option>
              ))}
            </select>
          </div>
        </div>
        <SocketStatus cpu={cpu} motherboard={motherboard} />
        <MemoryStatus memory={selectedMemory} motherboard={motherboard} />
        <PowerSupplyStatus cpu={cpu} gpu={gpu} psu={psu} />
      </section>

      <section className="panel" aria-labelledby="later-heading">
        <h2 id="later-heading">Still to check</h2>
        <ul className="slots">
          {laterChecks.map((slot) => (
            <li key={slot.id}>
              <span className="slot-label">{slot.label}</span>
              <span className="slot-value">{slot.note}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
