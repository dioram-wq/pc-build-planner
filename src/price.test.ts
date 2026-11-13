import { describe, expect, it } from 'vitest'
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

const catalog = [
  ...cpus,
  ...motherboards,
  ...memory,
  ...gpus,
  ...coolers,
  ...cases,
  ...psus,
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
    if (!cpu || !motherboard || !kit || !gpu || !cooler || !pcCase || !psu) {
      throw new Error('expected the default planner parts in the catalog')
    }

    expect(totalPriceUsd([cpu, motherboard, kit, gpu, cooler, pcCase, psu])).toBe(
      1061,
    )
    expect(totalPriceUsd([cpu, motherboard, kit, null, null, null, null])).toBe(
      487,
    )
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
