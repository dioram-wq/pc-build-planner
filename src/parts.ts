import type { Cpu, Motherboard } from './compatibility.ts'

export const cpus = [
  { id: 'cpu-7600', name: 'AMD Ryzen 5 7600', socket: 'AM5' },
  { id: 'cpu-5800x', name: 'AMD Ryzen 7 5800X', socket: 'AM4' },
  { id: 'cpu-14600k', name: 'Intel Core i5-14600K', socket: 'LGA1700' },
  { id: 'cpu-265k', name: 'Intel Core Ultra 7 265K', socket: 'LGA1851' },
] as const satisfies readonly Cpu[]

export const motherboards = [
  { id: 'board-b650', name: 'ASUS TUF Gaming B650-PLUS', socket: 'AM5' },
  { id: 'board-b550', name: 'MSI MAG B550 Tomahawk', socket: 'AM4' },
  { id: 'board-z790', name: 'Gigabyte Z790 Aorus Elite', socket: 'LGA1700' },
  { id: 'board-z890', name: 'ASUS ROG Strix Z890-F', socket: 'LGA1851' },
] as const satisfies readonly Motherboard[]

export const laterChecks = [
  { id: 'memory', label: 'Memory', note: 'RAM type vs motherboard' },
  { id: 'psu', label: 'Power supply', note: 'Wattage vs estimated draw' },
  { id: 'case', label: 'Case', note: 'Cooler height and graphics card length' },
] as const
