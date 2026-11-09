const slots = [
  { id: 'cpu', label: 'CPU' },
  { id: 'motherboard', label: 'Motherboard' },
  { id: 'memory', label: 'Memory' },
  { id: 'psu', label: 'Power supply' },
  { id: 'case', label: 'Case' },
] as const

export default function App() {
  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">Parts desk</p>
        <h1>PC Build Planner</h1>
        <p className="lede">
          Assemble a desktop from a short parts list. Compatibility checks land
          one rule at a time.
        </p>
      </header>
      <section className="panel" aria-labelledby="build-heading">
        <h2 id="build-heading">Build</h2>
        <ul className="slots">
          {slots.map((slot) => (
            <li key={slot.id}>
              <span className="slot-label">{slot.label}</span>
              <span className="slot-value">Not selected</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
