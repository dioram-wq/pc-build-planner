import type {
  Case,
  Cpu,
  CpuCooler,
  Gpu,
  Memory,
  Motherboard,
  Psu,
  StorageDrive,
} from './compatibility.ts'
import { samplePricesUsd } from './data/prices.ts'
import { applyPrices } from './price.ts'

const cpuCatalog = [
  {
    id: 'cpu-7600',
    name: 'AMD Ryzen 5 7600',
    socket: 'AM5',
    tdpWatts: 65,
  },
  {
    id: 'cpu-5800x',
    name: 'AMD Ryzen 7 5800X',
    socket: 'AM4',
    tdpWatts: 105,
  },
  {
    id: 'cpu-14600k',
    name: 'Intel Core i5-14600K',
    socket: 'LGA1700',
    tdpWatts: 125,
  },
  {
    id: 'cpu-265k',
    name: 'Intel Core Ultra 7 265K',
    socket: 'LGA1851',
    tdpWatts: 125,
  },
] as const satisfies readonly Cpu[]

export const cpus = applyPrices(cpuCatalog, samplePricesUsd)

const motherboardCatalog = [
  {
    id: 'board-b650',
    name: 'ASUS TUF Gaming B650-PLUS',
    socket: 'AM5',
    memoryType: 'DDR5',
    m2Slots: 3,
    sataPorts: 4,
    formFactor: 'ATX',
    dimmSlots: 4,
    maxMemoryGb: 192,
  },
  {
    id: 'board-b550',
    name: 'MSI MAG B550 Tomahawk',
    socket: 'AM4',
    memoryType: 'DDR4',
    m2Slots: 2,
    sataPorts: 6,
    formFactor: 'ATX',
    dimmSlots: 4,
    maxMemoryGb: 128,
  },
  {
    id: 'board-z790',
    name: 'Gigabyte Z790 Aorus Elite',
    socket: 'LGA1700',
    memoryType: 'DDR5',
    m2Slots: 4,
    sataPorts: 6,
    formFactor: 'ATX',
    dimmSlots: 4,
    maxMemoryGb: 192,
  },
  {
    id: 'board-z890',
    name: 'ASUS ROG Strix Z890-F',
    socket: 'LGA1851',
    memoryType: 'DDR5',
    m2Slots: 5,
    sataPorts: 4,
    formFactor: 'ATX',
    dimmSlots: 4,
    maxMemoryGb: 192,
  },
  {
    id: 'board-b650m',
    name: 'ASRock B650M-HDV/M.2',
    socket: 'AM5',
    memoryType: 'DDR5',
    m2Slots: 1,
    sataPorts: 4,
    formFactor: 'Micro-ATX',
    dimmSlots: 2,
    maxMemoryGb: 96,
  },
] as const satisfies readonly Motherboard[]

export const motherboards = applyPrices(motherboardCatalog, samplePricesUsd)

const memoryCatalog = [
  {
    id: 'mem-ddr5-6000',
    name: 'Corsair Vengeance 32GB DDR5-6000',
    memoryType: 'DDR5',
    modules: 2,
    capacityGb: 32,
  },
  {
    id: 'mem-ddr5-5600',
    name: 'G.Skill Flare X5 32GB DDR5-5600',
    memoryType: 'DDR5',
    modules: 2,
    capacityGb: 32,
  },
  {
    id: 'mem-ddr4-3600',
    name: 'Corsair Vengeance LPX 32GB DDR4-3600',
    memoryType: 'DDR4',
    modules: 2,
    capacityGb: 32,
  },
  {
    id: 'mem-ddr4-3200',
    name: 'G.Skill Ripjaws V 32GB DDR4-3200',
    memoryType: 'DDR4',
    modules: 2,
    capacityGb: 32,
  },
  {
    id: 'mem-ddr5-64',
    name: 'Corsair Vengeance 64GB DDR5-5600',
    memoryType: 'DDR5',
    modules: 4,
    capacityGb: 64,
  },
  {
    id: 'mem-ddr5-128',
    name: 'Kingston Fury Beast 128GB DDR5-5600',
    memoryType: 'DDR5',
    modules: 2,
    capacityGb: 128,
  },
] as const satisfies readonly Memory[]

export const memory = applyPrices(memoryCatalog, samplePricesUsd)

const gpuCatalog = [
  {
    id: 'gpu-4060',
    name: 'NVIDIA GeForce RTX 4060',
    boardPowerWatts: 115,
    lengthMm: 240,
    powerConnectors: [{ eightPin: 1, twelveVhpwr: 0 }],
  },
  {
    id: 'gpu-4070',
    name: 'NVIDIA GeForce RTX 4070',
    boardPowerWatts: 200,
    lengthMm: 244,
    powerConnectors: [
      { eightPin: 2, twelveVhpwr: 0 },
      { eightPin: 0, twelveVhpwr: 1 },
    ],
  },
  {
    id: 'gpu-7800xt',
    name: 'AMD Radeon RX 7800 XT',
    boardPowerWatts: 263,
    lengthMm: 267,
    powerConnectors: [{ eightPin: 2, twelveVhpwr: 0 }],
  },
  {
    id: 'gpu-4090',
    name: 'NVIDIA GeForce RTX 4090',
    boardPowerWatts: 450,
    lengthMm: 304,
    powerConnectors: [
      { eightPin: 3, twelveVhpwr: 0 },
      { eightPin: 0, twelveVhpwr: 1 },
    ],
  },
] as const satisfies readonly Gpu[]

export const gpus = applyPrices(gpuCatalog, samplePricesUsd)

const coolerCatalog = [
  {
    id: 'cooler-l12s',
    name: 'Noctua NH-L12S',
    heightMm: 70,
    sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'],
  },
  {
    id: 'cooler-l9a',
    name: 'Noctua NH-L9a',
    heightMm: 37,
    sockets: ['AM4', 'AM5'],
  },
  {
    id: 'cooler-pa120',
    name: 'Thermalright Peerless Assassin 120',
    heightMm: 157,
    sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'],
  },
  {
    id: 'cooler-nhd15',
    name: 'Noctua NH-D15',
    heightMm: 165,
    sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'],
  },
] as const satisfies readonly CpuCooler[]

export const coolers = applyPrices(coolerCatalog, samplePricesUsd)

const caseCatalog = [
  {
    id: 'case-north',
    name: 'Fractal Design North',
    maxGpuLengthMm: 355,
    maxCoolerHeightMm: 170,
    supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'],
    supportedPsuFormFactors: ['ATX'],
  },
  {
    id: 'case-lancool',
    name: 'Lian Li Lancool 216',
    maxGpuLengthMm: 392,
    maxCoolerHeightMm: 180,
    supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'],
    supportedPsuFormFactors: ['ATX'],
  },
  {
    id: 'case-nr200',
    name: 'Cooler Master NR200P',
    maxGpuLengthMm: 330,
    maxCoolerHeightMm: 155,
    supportedFormFactors: ['Mini-ITX'],
    supportedPsuFormFactors: ['SFX', 'SFX-L'],
  },
  {
    id: 'case-sg13',
    name: 'SilverStone SUGO SG13',
    maxGpuLengthMm: 270,
    maxCoolerHeightMm: 61,
    supportedFormFactors: ['Mini-ITX'],
    supportedPsuFormFactors: ['ATX', 'SFX'],
  },
] as const satisfies readonly Case[]

export const cases = applyPrices(caseCatalog, samplePricesUsd)

const psuCatalog = [
  {
    id: 'psu-550',
    name: 'Corsair CX550',
    wattage: 550,
    powerConnectors: { eightPin: 2, twelveVhpwr: 0 },
    formFactor: 'ATX',
  },
  {
    id: 'psu-650',
    name: 'Corsair RM650x',
    wattage: 650,
    powerConnectors: { eightPin: 4, twelveVhpwr: 0 },
    formFactor: 'ATX',
  },
  {
    id: 'psu-750',
    name: 'Seasonic Focus GX-750',
    wattage: 750,
    powerConnectors: { eightPin: 4, twelveVhpwr: 0 },
    formFactor: 'ATX',
  },
  {
    id: 'psu-850',
    name: 'Corsair RM850x',
    wattage: 850,
    powerConnectors: { eightPin: 3, twelveVhpwr: 1 },
    formFactor: 'ATX',
  },
  {
    id: 'psu-1000',
    name: 'be quiet! Straight Power 12',
    wattage: 1000,
    powerConnectors: { eightPin: 4, twelveVhpwr: 1 },
    formFactor: 'ATX',
  },
  {
    id: 'psu-sf750',
    name: 'Corsair SF750',
    wattage: 750,
    powerConnectors: { eightPin: 4, twelveVhpwr: 0 },
    formFactor: 'SFX',
  },
] as const satisfies readonly Psu[]

export const psus = applyPrices(psuCatalog, samplePricesUsd)

const storageCatalog = [
  { id: 'drive-sn770', name: 'WD Black SN770 1TB', interface: 'M.2 NVMe' },
  { id: 'drive-990pro', name: 'Samsung 990 Pro 2TB', interface: 'M.2 NVMe' },
  { id: 'drive-870evo', name: 'Samsung 870 EVO 1TB', interface: 'SATA' },
  { id: 'drive-mx500', name: 'Crucial MX500 1TB', interface: 'SATA' },
] as const satisfies readonly StorageDrive[]

export const storage = applyPrices(storageCatalog, samplePricesUsd)
