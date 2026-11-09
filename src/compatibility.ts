export type CpuSocket = 'AM4' | 'AM5' | 'LGA1700' | 'LGA1851'

export type Cpu = {
  id: string
  name: string
  socket: CpuSocket
}

export type Motherboard = {
  id: string
  name: string
  socket: CpuSocket
}

export type SocketMismatch = {
  code: 'socket-mismatch'
  message: string
}

export type SocketCheck = {
  compatible: boolean
  issues: SocketMismatch[]
}

export function checkCpuSocket(cpu: Cpu, motherboard: Motherboard): SocketCheck {
  if (cpu.socket === motherboard.socket) {
    return { compatible: true, issues: [] }
  }

  return {
    compatible: false,
    issues: [
      {
        code: 'socket-mismatch',
        message: `${cpu.name} (${cpu.socket}) does not fit ${motherboard.name} (${motherboard.socket}).`,
      },
    ],
  }
}
