# PC Build Planner

[![CI](https://github.com/dioram-wq/pc-build-planner/actions/workflows/ci.yml/badge.svg)](https://github.com/dioram-wq/pc-build-planner/actions/workflows/ci.yml)

A small web app for picking desktop parts, checking that they fit, totaling sample prices, and sharing the build with a link.

## Scripts

```bash
npm install
npm run dev    # planner at http://127.0.0.1:5173
npm test       # Vitest
npm run build  # typecheck and production build
```

Node.js 22 and npm 11 install cleanly. npm 10 can fail while resolving Vitest's optional peer dependencies.

## Compatibility

The planner currently checks five rules:

- **CPU socket.** The processor socket must match the motherboard socket. The sample catalog covers AM4, AM5, LGA1700, and LGA1851.
- **Memory type.** The memory type must match the type the motherboard takes. The sample catalog covers DDR4 and DDR5.
- **Power supply wattage.** Estimated draw is the CPU TDP, plus graphics-card board power when a card is selected, plus 100W for the motherboard, memory, storage, and fans. The supply should cover that draw with about 25% headroom. Meeting the headroom is ok, covering the draw without that headroom is tight, and falling short of the draw is insufficient. With no supply selected, the planner still shows the estimate.
- **Case clearance.** A graphics card has to be no longer than the case allows, and a CPU cooler no taller than the case allows. A card over that length is too long, and a cooler over that height is too tall. Matching a limit exactly is ok. With no case selected, the planner asks for one. If the card or the cooler is not selected, that comparison is skipped.
- **Storage interface.** An M.2 NVMe drive needs at least one M.2 slot on the motherboard, and a SATA drive needs at least one SATA port. With no drive selected, the planner asks for one. The sample catalog covers both interfaces.

## Price

Every part in the sample catalog has a price in whole US dollars. The planner adds the prices of the parts that are selected. Leaving the graphics card, cooler, case, power supply, or storage empty removes that part from the total. Edit `src/data/prices.json` to change a sample price; a part left out of that file counts as $0.

## Sharing

The address bar stores the selected part IDs in a short query string. Changing a part updates that link in place, and opening it later restores the same build. IDs the catalog does not know are left out. A graphics card, cooler, case, power supply, or drive that was left empty stays empty. The Copy link button copies the current address.

## Roadmap

- [x] Vite + React + TypeScript app, with Vitest
- [x] CPU and motherboard socket check
- [x] Memory type against the motherboard
- [x] Power supply wattage against estimated system draw
- [x] Case clearance for cooler height and graphics card length
- [x] CI on GitHub Actions
- [x] Running total price for the selected parts
- [x] Storage interface check (M.2 / SATA slots on the motherboard)
- [x] Save and share a build via the URL
- [x] Refresh sample part prices from a data file
- [ ] Mark incompatible parts in the dropdowns
- [ ] Break the running total down by selected part

## Note

Built with AI pair programming (Cursor agents) under Diogo Ramos's direction.
