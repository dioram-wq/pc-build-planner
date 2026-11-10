import { useState } from 'react'
import {
  checkCpuSocket,
  checkMemoryType,
  type Cpu,
  type Memory,
  type Motherboard,
} from './compatibility.ts'
import { cpus, laterChecks, memory, motherboards } from './parts.ts'

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

export default function App() {
  const [cpuId, setCpuId] = useState<string>(cpus[0].id)
  const [motherboardId, setMotherboardId] = useState<string>(motherboards[0].id)
  const [memoryId, setMemoryId] = useState<string>(memory[0].id)
  const cpu = findPart(cpus, cpuId)
  const motherboard = findPart(motherboards, motherboardId)
  const selectedMemory = findPart(memory, memoryId)

  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">Parts desk</p>
        <h1>PC Build Planner</h1>
        <p className="lede">
          Choose a processor, a motherboard, and memory. The planner checks
          that the CPU socket and the memory type match the board.
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
        </div>
        <SocketStatus cpu={cpu} motherboard={motherboard} />
        <MemoryStatus memory={selectedMemory} motherboard={motherboard} />
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
