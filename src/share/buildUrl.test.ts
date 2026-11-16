import { describe, expect, it } from 'vitest'
import {
  decodeBuild,
  emptyBuild,
  encodeBuild,
  isEmptyBuild,
  type BuildCatalog,
  type BuildSelection,
} from './buildUrl.ts'

const catalog: BuildCatalog = {
  cpu: ['cpu-7600', 'cpu-14600k'],
  motherboard: ['board-b650', 'board-z790'],
  memory: ['mem-ddr5-6000', 'mem-ddr4-3600'],
  gpu: ['gpu-4060', 'gpu-4070'],
  cooler: ['cooler-l12s'],
  case: ['case-north'],
  psu: ['psu-550'],
  storage: ['drive-sn770', 'drive-870evo'],
}

const fullBuild: BuildSelection = {
  cpu: 'cpu-7600',
  motherboard: 'board-b650',
  memory: 'mem-ddr5-6000',
  gpu: 'gpu-4060',
  cooler: 'cooler-l12s',
  case: 'case-north',
  psu: 'psu-550',
  storage: 'drive-sn770',
}

const encodedFull =
  'c=cpu-7600&b=board-b650&m=mem-ddr5-6000&g=gpu-4060&h=cooler-l12s&e=case-north&p=psu-550&d=drive-sn770'

describe('encodeBuild and decodeBuild', () => {
  it('round-trips a full build through a query or hash string', () => {
    expect(encodeBuild(fullBuild)).toBe(encodedFull)
    expect(decodeBuild(encodedFull, catalog)).toEqual(fullBuild)
    expect(decodeBuild(`?${encodedFull}`, catalog)).toEqual(fullBuild)
    expect(decodeBuild(`#${encodedFull}`, catalog)).toEqual(fullBuild)
    expect(
      decodeBuild(`https://planner.example/build?${encodedFull}`, catalog),
    ).toEqual(fullBuild)
    expect(
      decodeBuild(`https://planner.example/build#${encodedFull}`, catalog),
    ).toEqual(fullBuild)
  })

  it('round-trips an empty build', () => {
    const empty = emptyBuild()

    expect(isEmptyBuild(empty)).toBe(true)
    expect(encodeBuild(empty)).toBe('')
    expect(decodeBuild('', catalog)).toEqual(empty)
    expect(decodeBuild('?', catalog)).toEqual(empty)
    expect(decodeBuild('#', catalog)).toEqual(empty)
    expect(decodeBuild('   ', catalog)).toEqual(empty)
  })

  it('omits empty slots and keeps the rest', () => {
    const selection: BuildSelection = {
      ...emptyBuild(),
      cpu: 'cpu-14600k',
      motherboard: 'board-z790',
      memory: 'mem-ddr5-6000',
    }

    const encoded = encodeBuild(selection)

    expect(encoded).toBe('c=cpu-14600k&b=board-z790&m=mem-ddr5-6000')
    expect(decodeBuild(encoded, catalog)).toEqual(selection)
    expect(isEmptyBuild(selection)).toBe(false)
  })

  it('ignores unknown ids, unknown keys, and ids in the wrong slot', () => {
    const encoded = encodeBuild({
      ...fullBuild,
      gpu: 'gpu-nope',
      case: '',
    })

    expect(encoded).toContain('g=gpu-nope')
    expect(encoded).not.toContain('e=')

    const decoded = decodeBuild(
      'c=cpu-missing&c=cpu-14600k&b=gpu-4060&g=gpu-4070&x=case-north&cooler=cooler-l12s',
      catalog,
    )

    expect(decoded.cpu).toBe('cpu-14600k')
    expect(decoded.motherboard).toBe('')
    expect(decoded.gpu).toBe('gpu-4070')
    expect(decoded.case).toBe('')
    expect(decoded.cooler).toBe('')
    expect(decodeBuild(encoded, catalog).gpu).toBe('')
    expect(decodeBuild(encoded, catalog).cpu).toBe('cpu-7600')
    expect(decodeBuild('c=%20cpu-7600', catalog).cpu).toBe('cpu-7600')
  })

  it('ignores malformed input', () => {
    const empty = emptyBuild()

    expect(decodeBuild(undefined, catalog)).toEqual(empty)
    expect(decodeBuild(null, catalog)).toEqual(empty)
    expect(decodeBuild(12, catalog)).toEqual(empty)
    expect(decodeBuild({ c: 'cpu-7600' }, catalog)).toEqual(empty)
    expect(decodeBuild('%%%', catalog)).toEqual(empty)
    expect(decodeBuild('=&&&', catalog)).toEqual(empty)
    expect(decodeBuild('http://[', catalog)).toEqual(empty)
    expect(decodeBuild('c=%E0%A4%A', catalog)).toEqual(empty)
  })

  it('keeps valid ids when the rest of the string is junk', () => {
    expect(decodeBuild('c=cpu-7600&%%%&b=', catalog).cpu).toBe('cpu-7600')
    expect(decodeBuild('  ?c=cpu-7600&b=board-b650#ignored', catalog)).toEqual({
      ...emptyBuild(),
      cpu: 'cpu-7600',
      motherboard: 'board-b650',
    })
  })

  it('skips ids that are not safe tokens', () => {
    expect(
      encodeBuild({
        ...emptyBuild(),
        cpu: ' cpu-7600 ',
        gpu: 'gpu 4060',
        cooler: 'cooler=<x>',
        storage: '',
      }),
    ).toBe('c=cpu-7600')
  })
})
