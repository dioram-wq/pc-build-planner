import { describe, expect, it } from 'vitest'
import {
  checkCpuSocket,
  type Cpu,
  type CpuSocket,
  type Motherboard,
} from './compatibility.ts'
import { cpus, motherboards } from './parts.ts'

function cpu(socket: CpuSocket, name = 'Sample CPU'): Cpu {
  return { id: `cpu-${socket}`, name, socket }
}

function board(socket: CpuSocket, name = 'Sample motherboard'): Motherboard {
  return { id: `board-${socket}`, name, socket }
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

describe('sample catalog', () => {
  it('offers a motherboard for every CPU socket', () => {
    for (const part of cpus) {
      expect(motherboards.some((board) => board.socket === part.socket)).toBe(
        true,
      )
    }
  })
})
