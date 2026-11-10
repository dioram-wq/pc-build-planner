# PC Build Planner

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

The planner currently checks two rules:

- **CPU socket.** The processor socket must match the motherboard socket. The sample catalog covers AM4, AM5, LGA1700, and LGA1851.
- **Memory type.** The memory type must match the type the motherboard takes. The sample catalog covers DDR4 and DDR5.

## Roadmap

- [x] Vite + React + TypeScript app, with Vitest
- [x] CPU and motherboard socket check
- [x] Memory type against the motherboard
- [ ] Power supply wattage against estimated system draw
- [ ] Case clearance for cooler height and graphics card length

## Note

Built with AI pair programming (Cursor agents) under Diogo Ramos's direction.
