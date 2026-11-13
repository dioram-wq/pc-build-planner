import type {
  Case,
  Cpu,
  CpuCooler,
  Gpu,
  Memory,
  Motherboard,
  Psu,
} from './compatibility.ts'

type Priced<Part> = Part & { priceUsd: number }

export const cpus = [
  {
    id: 'cpu-7600',
    name: 'AMD Ryzen 5 7600',
    socket: 'AM5',
    tdpWatts: 65,
    priceUsd: 199,
  },
  {
    id: 'cpu-5800x',
    name: 'AMD Ryzen 7 5800X',
    socket: 'AM4',
    tdpWatts: 105,
    priceUsd: 189,
  },
  {
    id: 'cpu-14600k',
    name: 'Intel Core i5-14600K',
    socket: 'LGA1700',
    tdpWatts: 125,
    priceUsd: 229,
  },
  {
    id: 'cpu-265k',
    name: 'Intel Core Ultra 7 265K',
    socket: 'LGA1851',
    tdpWatts: 125,
    priceUsd: 379,
  },
] as const satisfies readonly Priced<Cpu>[]

export const motherboards = [
  {
    id: 'board-b650',
    name: 'ASUS TUF Gaming B650-PLUS',
    socket: 'AM5',
    memoryType: 'DDR5',
    priceUsd: 179,
  },
  {
    id: 'board-b550',
    name: 'MSI MAG B550 Tomahawk',
    socket: 'AM4',
    memoryType: 'DDR4',
    priceUsd: 149,
  },
  {
    id: 'board-z790',
    name: 'Gigabyte Z790 Aorus Elite',
    socket: 'LGA1700',
    memoryType: 'DDR5',
    priceUsd: 229,
  },
  {
    id: 'board-z890',
    name: 'ASUS ROG Strix Z890-F',
    socket: 'LGA1851',
    memoryType: 'DDR5',
    priceUsd: 399,
  },
] as const satisfies readonly Priced<Motherboard>[]

export const memory = [
  {
    id: 'mem-ddr5-6000',
    name: 'Corsair Vengeance 32GB DDR5-6000',
    memoryType: 'DDR5',
    priceUsd: 109,
  },
  {
    id: 'mem-ddr5-5600',
    name: 'G.Skill Flare X5 32GB DDR5-5600',
    memoryType: 'DDR5',
    priceUsd: 99,
  },
  {
    id: 'mem-ddr4-3600',
    name: 'Corsair Vengeance LPX 32GB DDR4-3600',
    memoryType: 'DDR4',
    priceUsd: 69,
  },
  {
    id: 'mem-ddr4-3200',
    name: 'G.Skill Ripjaws V 32GB DDR4-3200',
    memoryType: 'DDR4',
    priceUsd: 59,
  },
] as const satisfies readonly Priced<Memory>[]

export const gpus = [
  {
    id: 'gpu-4060',
    name: 'NVIDIA GeForce RTX 4060',
    boardPowerWatts: 115,
    lengthMm: 240,
    priceUsd: 299,
  },
  {
    id: 'gpu-4070',
    name: 'NVIDIA GeForce RTX 4070',
    boardPowerWatts: 200,
    lengthMm: 244,
    priceUsd: 549,
  },
  {
    id: 'gpu-7800xt',
    name: 'AMD Radeon RX 7800 XT',
    boardPowerWatts: 263,
    lengthMm: 267,
    priceUsd: 479,
  },
  {
    id: 'gpu-4090',
    name: 'NVIDIA GeForce RTX 4090',
    boardPowerWatts: 450,
    lengthMm: 304,
    priceUsd: 1599,
  },
] as const satisfies readonly Priced<Gpu>[]

export const coolers = [
  {
    id: 'cooler-l12s',
    name: 'Noctua NH-L12S',
    heightMm: 70,
    priceUsd: 70,
  },
  { id: 'cooler-l9a', name: 'Noctua NH-L9a', heightMm: 37, priceUsd: 45 },
  {
    id: 'cooler-pa120',
    name: 'Thermalright Peerless Assassin 120',
    heightMm: 157,
    priceUsd: 40,
  },
  { id: 'cooler-nhd15', name: 'Noctua NH-D15', heightMm: 165, priceUsd: 110 },
] as const satisfies readonly Priced<CpuCooler>[]

export const cases = [
  {
    id: 'case-north',
    name: 'Fractal Design North',
    maxGpuLengthMm: 355,
    maxCoolerHeightMm: 170,
    priceUsd: 140,
  },
  {
    id: 'case-lancool',
    name: 'Lian Li Lancool 216',
    maxGpuLengthMm: 392,
    maxCoolerHeightMm: 180,
    priceUsd: 100,
  },
  {
    id: 'case-nr200',
    name: 'Cooler Master NR200P',
    maxGpuLengthMm: 330,
    maxCoolerHeightMm: 155,
    priceUsd: 110,
  },
  {
    id: 'case-sg13',
    name: 'SilverStone SUGO SG13',
    maxGpuLengthMm: 270,
    maxCoolerHeightMm: 61,
    priceUsd: 70,
  },
] as const satisfies readonly Priced<Case>[]

export const psus = [
  { id: 'psu-550', name: 'Corsair CX550', wattage: 550, priceUsd: 65 },
  { id: 'psu-650', name: 'Corsair RM650x', wattage: 650, priceUsd: 110 },
  { id: 'psu-750', name: 'Seasonic Focus GX-750', wattage: 750, priceUsd: 120 },
  { id: 'psu-850', name: 'Corsair RM850x', wattage: 850, priceUsd: 140 },
  {
    id: 'psu-1000',
    name: 'be quiet! Straight Power 12',
    wattage: 1000,
    priceUsd: 180,
  },
] as const satisfies readonly Priced<Psu>[]
