import { describe, expect, it } from 'vitest'
import {
  checkCpuSocket,
  checkMemoryType,
  type Cpu,
  type CpuSocket,
  type Memory,
  type MemoryType,
  type Motherboard,
} from './compatibility.ts'
import { cpus, memory, motherboards } from './parts.ts'

function cpu(socket: CpuSocket, name = 'Sample CPU'): Cpu {
  return { id: `cpu-${socket}`, name, socket }
}

function board(
  socket: CpuSocket,
  name = 'Sample motherboard',
  memoryType: MemoryType = 'DDR5',
): Motherboard {
  return { id: `board-${socket}`, name, socket, memoryType }
}

function kit(memoryType: MemoryType, name = 'Sample memory'): Memory {
  return { id: `mem-${memoryType}`, name, memoryType }
}

describe('checkCpuSocket', () => {
  it('accepts a CPU that uses the motherboard socket', () => {
    const result = checkCpuSocket(
      cpu('AM5', 'AMD Ryzen 5 7600'),
      board('AM5', 'ASUS TUF Gaming B650-PLUS'),
    )

    expect(result).toEqual({ compatible: true, issues: [] })
  })

  it('rejects a socket mismatch and names both sockets', () => {
    const result = checkCpuSocket(
      cpu('AM5', 'AMD Ryzen 5 7600'),
      board('AM4', 'MSI MAG B550 Tomahawk'),
    )

    expect(result).toEqual({
      compatible: false,
      issues: [
        {
          code: 'socket-mismatch',
          message:
            'AMD Ryzen 5 7600 (AM5) does not fit MSI MAG B550 Tomahawk (AM4).',
        },
      ],
    })
  })

  it('treats each supported socket as its own match', () => {
    const sockets = ['AM4', 'AM5', 'LGA1700', 'LGA1851'] as const

    for (const socket of sockets) {
      expect(checkCpuSocket(cpu(socket), board(socket)).compatible).toBe(true)
      expect(
        checkCpuSocket(cpu(socket), board(socket === 'AM5' ? 'AM4' : 'AM5'))
          .compatible,
      ).toBe(false)
    }
  })
})

describe('checkMemoryType', () => {
  it('accepts memory that uses the motherboard type', () => {
    const result = checkMemoryType(
      kit('DDR5', 'Corsair Vengeance 32GB DDR5-6000'),
      board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5'),
    )

    expect(result).toEqual({ compatible: true, issues: [] })
  })

  it('rejects a memory type mismatch and names both types', () => {
    const result = checkMemoryType(
      kit('DDR4', 'Corsair Vengeance LPX 32GB DDR4-3600'),
      board('AM5', 'ASUS TUF Gaming B650-PLUS', 'DDR5'),
    )

    expect(result).toEqual({
      compatible: false,
      issues: [
        {
          code: 'memory-mismatch',
          message:
            'Corsair Vengeance LPX 32GB DDR4-3600 (DDR4) does not fit ASUS TUF Gaming B650-PLUS (DDR5).',
        },
      ],
    })
  })

  it('treats each supported memory type as its own match', () => {
    const types = ['DDR4', 'DDR5'] as const

    for (const memoryType of types) {
      expect(
        checkMemoryType(
          kit(memoryType),
          board('AM5', 'Sample motherboard', memoryType),
        ).compatible,
      ).toBe(true)
      expect(
        checkMemoryType(
          kit(memoryType),
          board(
            'AM5',
            'Sample motherboard',
            memoryType === 'DDR5' ? 'DDR4' : 'DDR5',
          ),
        ).compatible,
      ).toBe(false)
    }
  })
})

describe('sample catalog', () => {
  it('offers a motherboard for every CPU socket', () => {
    for (const part of cpus) {
      expect(motherboards.some((board) => board.socket === part.socket)).toBe(
        true,
      )
    }
  })

  it('includes DDR4 and DDR5 memory and a motherboard for each', () => {
    const types = ['DDR4', 'DDR5'] as const

    for (const memoryType of types) {
      expect(memory.some((part) => part.memoryType === memoryType)).toBe(true)
      expect(
        motherboards.some((part) => part.memoryType === memoryType),
      ).toBe(true)
    }
  })
})
