# PC Build Planner

[![CI](https://github.com/dioram-wq/pc-build-planner/actions/workflows/ci.yml/badge.svg)](https://github.com/dioram-wq/pc-build-planner/actions/workflows/ci.yml)

A small web app for picking desktop parts and checking that they fit.

## Scripts

```bash
npm install
npm run dev    # planner at http://127.0.0.1:5173
npm test       # Vitest
npm run build  # typecheck and production build
```

Node.js 22 and npm 11 install cleanly. npm 10 can fail while resolving Vitest's optional peer dependencies.

## Compatibility

The planner currently checks four rules:

- **CPU socket.** The processor socket must match the motherboard socket. The sample catalog covers AM4, AM5, LGA1700, and LGA1851.
- **Memory type.** The memory type must match the type the motherboard takes. The sample catalog covers DDR4 and DDR5.
- **Power supply wattage.** Estimated draw is the CPU TDP, plus graphics-card board power when a card is selected, plus 100W for the motherboard, memory, storage, and fans. The supply should cover that draw with about 25% headroom. Meeting the headroom is ok, covering the draw without that headroom is tight, and falling short of the draw is insufficient. With no supply selected, the planner still shows the estimate.
- **Case clearance.** A graphics card has to be no longer than the case allows, and a CPU cooler no taller than the case allows. A card over that length is too long, and a cooler over that height is too tall. Matching a limit exactly is ok. With no case selected, the planner asks for one. If the card or the cooler is not selected, that comparison is skipped.

## Roadmap

- [x] Vite + React + TypeScript app, with Vitest
- [x] CPU and motherboard socket check
- [x] Memory type against the motherboard
- [x] Power supply wattage against estimated system draw
- [x] Case clearance for cooler height and graphics card length
- [x] CI on GitHub Actions
- [ ] Running total price for the selected parts
- [ ] Storage interface check (M.2 / SATA slots on the motherboard)
- [ ] Save and share a build via the URL

## Note

Built with AI pair programming (Cursor agents) under Diogo Ramos's direction.
