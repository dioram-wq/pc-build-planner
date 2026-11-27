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

The planner currently checks ten rules:

- **CPU socket.** The processor socket must match the motherboard socket. The sample catalog covers AM4, AM5, LGA1700, and LGA1851.
- **Memory type.** The memory type must match the type the motherboard takes. The sample catalog covers DDR4 and DDR5.
- **Memory capacity.** The kit's module count has to be no higher than the motherboard's DIMM slots, and its total capacity no higher than the maximum the board supports. Matching either limit exactly is ok. More modules than there are slots, or more gigabytes than the board allows, is a conflict. When the kit or the board does not list a module count, a capacity, a slot count, or a maximum, that comparison is skipped and does not count as a conflict. The sample catalog includes a two-slot board, a four-module kit that needs more slots, and a kit over that board's maximum.
- **CPU cooler socket.** The cooler lists the sockets it supports, and it fits when the processor's socket is on that list. The sample NH-L9a covers AM4 and AM5. The other sample coolers cover AM4, AM5, LGA1700, and LGA1851. With no cooler selected, or when the cooler or the processor does not list a socket, the planner asks for that data and does not count a conflict.
- **Power supply wattage.** Estimated draw is the CPU TDP, plus graphics-card board power when a card is selected, plus 100W for the motherboard, memory, storage, and fans. The supply should cover that draw with about 25% headroom. Meeting the headroom is ok, covering the draw without that headroom is tight, and falling short of the draw is insufficient. With no supply selected, the planner still shows the estimate.
- **Graphics card power connectors.** The card lists each way it can be powered, as counts of 8-pin and 12VHPWR connectors. A set can require one type, the other, or both, and the card can list more than one set. The supply lists how many of each it provides. The card fits when the supply covers every connector in at least one set. Meeting a count exactly is ok, and extra connectors on the supply are ok. A supply that is short of every listed set is a conflict. With no graphics card selected, or no power supply selected, the planner asks for that part and does not count a conflict. When the card or the supply does not list connector counts, that comparison is skipped and does not count as a conflict. The sample RTX 4060 needs one 8-pin connector, and the RX 7800 XT needs two. The RTX 4070 and RTX 4090 each accept either 8-pin connectors or one 12VHPWR connector. The sample CX550 provides two 8-pin connectors and no 12VHPWR, so it powers the 4060, the 7800 XT, and the 4070, and it does not power the 4090. The RM650x provides four 8-pin connectors, which covers the 4090, and the Straight Power 12 provides a 12VHPWR connector as well.
- **Case clearance.** A graphics card has to be no longer than the case allows, and a CPU cooler no taller than the case allows. A card over that length is too long, and a cooler over that height is too tall. Matching a limit exactly is ok. With no case selected, the planner asks for one. If the card or the cooler is not selected, that comparison is skipped.
- **Storage interface.** An M.2 NVMe drive needs at least one M.2 slot on the motherboard, and a SATA drive needs at least one SATA port. With no drive selected, the planner asks for one. The sample catalog covers both interfaces.
- **Motherboard form factor.** The case lists the board sizes it supports, and a board fits only when its size is on that list. The sample catalog covers ATX, Micro-ATX, and Mini-ITX. With no case selected, or when the board or the case does not list a size, the planner asks for that data and does not count a conflict.
- **Power supply form factor.** The case lists the power supply sizes it supports, and a supply fits only when its size is on that list. The sample catalog covers ATX, SFX, and SFX-L. An SFX supply does not fit a case that lists only SFX-L, and an SFX-L supply does not fit a case that lists only SFX. With no power supply selected, or no case selected, the planner asks for that part and does not count a conflict. When the supply or the case does not list a size, that comparison is skipped and does not count as a conflict. The sample CX550, RM650x, Focus GX-750, RM850x, and Straight Power 12 are ATX. The SF750 is SFX. The North and the Lancool 216 take an ATX supply. The NR200P takes SFX and SFX-L. The SG13 takes ATX and SFX. An ATX supply fits the North and the SG13, and it does not fit the NR200P. The SF750 fits the NR200P and the SG13, and it does not fit the North.

## Build status

A line at the top of the build summarizes the compatibility checks. Until a processor and a motherboard are both selected, it reads "Pick a CPU and motherboard to start". After that, each conflict counts as one compatibility issue, using the same conflicts the part lists mark as incompatible: a socket mismatch, a memory mismatch, a memory kit with too many modules or more capacity than the board allows, a graphics card that is too long, a cooler that is too tall, a cooler that does not support the processor socket, a power supply below the estimated draw, a graphics card whose power connectors the supply does not provide, a drive the motherboard cannot take, a motherboard the case cannot take, and a power supply the case cannot take. One conflict reads "1 compatibility issue". More than one reads "2 compatibility issues", and so on. When none of those apply, the line reads "All checks pass". A supply that only misses the recommended headroom, a graphics card, cooler, case, power supply, or drive that is not selected yet, a board or case that does not list a form factor, a kit or board that does not list memory capacity, a cooler or processor that does not list a socket, a graphics card or power supply that does not list power connectors, and a power supply or case that does not list a power supply size, stay out of that count. The lines under the part lists still describe those cases.

## Incompatible options

Each part list marks an option that conflicts with the parts already chosen, using the same rules as the status lines. The label gains a text suffix such as "— incompatible: socket AM5", so the warning is not color alone, and the option can still be selected. A comparison with nothing selected yet leaves that option unmarked.

A processor is marked when its socket differs from the selected motherboard, and a motherboard is marked when its socket differs from the selected processor. A processor is also marked when the selected cooler does not support its socket, and a cooler is marked when it leaves the selected processor's socket off its list. Memory is marked the same way for DDR4 and DDR5, and when the kit has more modules than the board has DIMM slots or more capacity than the board supports. A motherboard is marked for that kit in the same way. A graphics card is marked when it is longer than the selected case allows, a cooler when it is taller, and a case when the selected card or cooler does not fit. Matching a limit exactly stays unmarked. A drive is marked when the motherboard has no M.2 slot or SATA port for its interface, and a motherboard is marked when it cannot take the selected drive. A motherboard is also marked when the selected case does not list its form factor, and a case is marked when it does not list the selected motherboard. A power supply is marked when its wattage is below the estimated draw, and when it does not cover any set of 8-pin and 12VHPWR connectors the selected graphics card accepts. A graphics card is marked for that supply in the same way. A power supply is also marked when the selected case does not list its form factor, and a case is marked when it does not list the selected power supply. A supply that covers the draw but is short of the recommended headroom keeps its ordinary label. A board or case that does not list a size, a kit or board that does not list memory capacity, a cooler or processor that does not list a socket, a graphics card or power supply that does not list power connectors, and a power supply or case that does not list a power supply size, stay unmarked.

## Price

Every part in the sample catalog has a price in whole US dollars. The planner adds the prices of the parts that are selected, and lists each selected part under that total with its name and price. Leaving the graphics card, cooler, case, power supply, or storage empty removes that part from the list and from the total. A selected part that does not carry a price is shown as — and left out of the total. Edit `src/data/prices.json` to change a sample price; a part left out of that file counts as $0.

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
- [x] Mark incompatible parts in the dropdowns
- [x] Break the running total down by selected part
- [x] Overall build status summary
- [x] Motherboard form factor against the case
- [x] Memory capacity and DIMM slots against the motherboard
- [x] CPU cooler socket against the processor
- [x] Graphics card power connectors against the power supply
- [x] Power supply form factor against the case

## Note

Built with AI pair programming (Cursor agents) under Diogo Ramos's direction.
