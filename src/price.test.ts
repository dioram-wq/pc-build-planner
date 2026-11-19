import { describe, expect, it } from 'vitest'
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
import { samplePricesUsd } from './data/prices.ts'
import {
  applyPrices,
  buildPriceBreakdown,
  formatUsd,
  totalPriceUsd,
} from './price.ts'

const catalog = [
  ...cpus,
  ...motherboards,
  ...memory,
  ...gpus,
  ...coolers,
  ...cases,
  ...psus,
  ...storage,
]

describe('totalPriceUsd', () => {
  it('adds the prices of the parts it is given', () => {
    expect(
      totalPriceUsd([{ priceUsd: 200 }, { priceUsd: 50 }, { priceUsd: 0 }]),
    ).toBe(250)
  })

  it('ignores empty slots', () => {
    expect(
      totalPriceUsd([{ priceUsd: 200 }, null, undefined, { priceUsd: 15 }]),
    ).toBe(215)
  })

  it('returns zero when nothing is selected', () => {
    expect(totalPriceUsd([])).toBe(0)
    expect(totalPriceUsd([null, undefined])).toBe(0)
  })

  it('sums the parts selected by default in the planner', () => {
    const cpu = cpus.find((part) => part.id === 'cpu-7600')
    const motherboard = motherboards.find((part) => part.id === 'board-b650')
    const kit = memory.find((part) => part.id === 'mem-ddr5-6000')
    const gpu = gpus.find((part) => part.id === 'gpu-4060')
    const cooler = coolers.find((part) => part.id === 'cooler-l12s')
    const pcCase = cases.find((part) => part.id === 'case-north')
    const psu = psus.find((part) => part.id === 'psu-550')
    const drive = storage.find((part) => part.id === 'drive-sn770')
    if (
      !cpu ||
      !motherboard ||
      !kit ||
      !gpu ||
      !cooler ||
      !pcCase ||
      !psu ||
      !drive
    ) {
      throw new Error('expected the default planner parts in the catalog')
    }

    expect(
      totalPriceUsd([cpu, motherboard, kit, gpu, cooler, pcCase, psu, drive]),
    ).toBe(1131)
    expect(
      totalPriceUsd([cpu, motherboard, kit, null, null, null, null, drive]),
    ).toBe(557)
    expect(
      totalPriceUsd([cpu, motherboard, kit, null, null, null, null, null]),
    ).toBe(487)
  })
})

describe('applyPrices', () => {
  it('applies known prices by part id', () => {
    const priced = applyPrices(
      [
        { id: 'cpu-7600', name: 'AMD Ryzen 5 7600' },
        { id: 'gpu-4090', name: 'NVIDIA GeForce RTX 4090' },
      ],
      samplePricesUsd,
    )

    expect(priced).toEqual([
      { id: 'cpu-7600', name: 'AMD Ryzen 5 7600', priceUsd: 199 },
      { id: 'gpu-4090', name: 'NVIDIA GeForce RTX 4090', priceUsd: 1599 },
    ])
  })

  it('falls back to zero when a part has no price entry', () => {
    const priced = applyPrices(
      [
        { id: 'cpu-7600', name: 'AMD Ryzen 5 7600' },
        { id: 'cpu-unlisted', name: 'Unlisted CPU' },
      ],
      samplePricesUsd,
    )

    expect(priced[0].priceUsd).toBe(199)
    expect(priced[1]).toEqual({
      id: 'cpu-unlisted',
      name: 'Unlisted CPU',
      priceUsd: 0,
    })
    expect(totalPriceUsd(priced)).toBe(199)
  })

  it('leaves the total unchanged for an empty build', () => {
    expect(totalPriceUsd(applyPrices([], samplePricesUsd))).toBe(0)
  })
})

describe('buildPriceBreakdown', () => {
  const cpu = { name: 'AMD Ryzen 5 7600', priceUsd: 199 }
  const motherboard = { name: 'ASUS TUF Gaming B650-PLUS', priceUsd: 179 }
  const kit = { name: 'Corsair Vengeance 32GB DDR5-6000', priceUsd: 109 }
  const gpu = { name: 'NVIDIA GeForce RTX 4060', priceUsd: 299 }
  const cooler = { name: 'Noctua NH-L12S', priceUsd: 70 }
  const pcCase = { name: 'Fractal Design North', priceUsd: 140 }
  const psu = { name: 'Corsair CX550', priceUsd: 65 }
  const drive = { name: 'WD Black SN770 1TB', priceUsd: 70 }

  const fullBuild = [
    { category: 'CPU', part: cpu },
    { category: 'Motherboard', part: motherboard },
    { category: 'Memory', part: kit },
    { category: 'Graphics card', part: gpu },
    { category: 'CPU cooler', part: cooler },
    { category: 'Case', part: pcCase },
    { category: 'Power supply', part: psu },
    { category: 'Storage', part: drive },
  ]

  it('returns no lines for an empty build', () => {
    const empty = fullBuild.map((slot) => ({ ...slot, part: null }))

    expect(buildPriceBreakdown(empty)).toEqual([])
    expect(totalPriceUsd(empty.map((slot) => slot.part))).toBe(0)
  })

  it('skips unselected parts in a partial build', () => {
    const partial = [
      { category: 'CPU', part: cpu },
      { category: 'Motherboard', part: motherboard },
      { category: 'Memory', part: kit },
      { category: 'Graphics card', part: null },
      { category: 'CPU cooler', part: undefined },
      { category: 'Case', part: null },
      { category: 'Power supply', part: null },
      { category: 'Storage', part: drive },
    ]

    expect(buildPriceBreakdown(partial)).toEqual([
      { category: 'CPU', name: cpu.name, priceUsd: 199 },
      { category: 'Motherboard', name: motherboard.name, priceUsd: 179 },
      { category: 'Memory', name: kit.name, priceUsd: 109 },
      { category: 'Storage', name: drive.name, priceUsd: 70 },
    ])
    expect(totalPriceUsd(partial.map((slot) => slot.part))).toBe(557)
  })

  it('lists every selected part in a full build', () => {
    expect(buildPriceBreakdown(fullBuild)).toEqual([
      { category: 'CPU', name: cpu.name, priceUsd: 199 },
      { category: 'Motherboard', name: motherboard.name, priceUsd: 179 },
      { category: 'Memory', name: kit.name, priceUsd: 109 },
      { category: 'Graphics card', name: gpu.name, priceUsd: 299 },
      { category: 'CPU cooler', name: cooler.name, priceUsd: 70 },
      { category: 'Case', name: pcCase.name, priceUsd: 140 },
      { category: 'Power supply', name: psu.name, priceUsd: 65 },
      { category: 'Storage', name: drive.name, priceUsd: 70 },
    ])
    expect(totalPriceUsd(fullBuild.map((slot) => slot.part))).toBe(1131)
  })

  it('leaves a part with no price out of the total', () => {
    const slots = [
      { category: 'CPU', part: cpu },
      { category: 'Graphics card', part: { name: 'Unlisted GPU' } },
      { category: 'Case', part: { name: 'Bare case', priceUsd: null } },
    ]

    expect(buildPriceBreakdown(slots)).toEqual([
      { category: 'CPU', name: cpu.name, priceUsd: 199 },
      { category: 'Graphics card', name: 'Unlisted GPU', priceUsd: null },
      { category: 'Case', name: 'Bare case', priceUsd: null },
    ])
    expect(totalPriceUsd([{ priceUsd: 199 }, {}, { priceUsd: null }])).toBe(199)
    expect(
      buildPriceBreakdown(slots).reduce(
        (total, line) => total + (line.priceUsd ?? 0),
        0,
      ),
    ).toBe(totalPriceUsd(slots.map((slot) => slot.part)))
  })
})

describe('formatUsd', () => {
  it('formats whole dollar amounts', () => {
    expect(formatUsd(0)).toBe('$0')
    expect(formatUsd(40)).toBe('$40')
    expect(formatUsd(1061)).toBe('$1,061')
  })
})

describe('sample prices', () => {
  it('stores a positive whole-dollar price on every catalog part', () => {
    expect(catalog.length).toBeGreaterThan(0)
    for (const part of catalog) {
      expect(part.priceUsd).toBeGreaterThan(0)
      expect(Number.isInteger(part.priceUsd)).toBe(true)
    }
  })
})
