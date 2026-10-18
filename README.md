# Pip's Midnight Observatory ✦

A whimsical, early-web-inspired interactive portfolio centered on Pip, a junior dream engineer. The five-scene story—Observatory, Lullaby Lab, Nightlight Workshop, Rooftop Delivery, and Nursery—connects the portfolio's animated worlds into one journey. Each scene has fewer than 150 words, a keyboard-accessible chapter guide, animated SVG artwork, and a reduced-motion presentation.

**Live site:** https://animated-character-portfolio-a18l.vercel.app  
**Source:** https://github.com/Jaiswaran/animated-character-portfolio

## Pip's complete story

Follow the dream from its first flicker to its safe delivery. Scroll through the five scenes or use the persistent chapter controls to jump directly to a scene. Scene progress updates as the reader moves; all essential story information is visible without audio, and system reduced-motion preferences disable continuous motion and smooth scrolling.

## The three inventions

- **Nightlight Collection** — choose one of four lamp tints, preview day/night lighting, and play or wind up the synthesized music box. The observatory scene stays dark and steady; changing a mood tints the lantern and its glow rather than replacing the whole background.
- **Dream Delivery Routes** — send Pip to five rooftop stations, watch the curved flight and parcel drop, follow the flight progress, run the Grand Midnight Tour, and reset delivery marks.
- **Rattle & Block Toys** — choose shapes and paint, stack up to eight blocks in a column, shake rattles, test stability, undo actions, clear the table, or load a blueprint.

## Navigation and interaction notes

- Each invention opens in a full-screen dialog. Use **Back to inventions**, the close button, **Escape**, a click on the backdrop, or the browser's Back button to leave it.
- The dialog traps keyboard focus while open and returns focus to the previous control when closed.
- Toy blocks and column actions support keyboard interaction; button-based actions remain independent from the card's open action.
- Sound effects are synthesized by the app and may require the first user interaction to unlock audio in the browser.

## Local development

Requirements: Node.js 24 and Bun.

```bash
bun install --frozen-lockfile
bun run dev
```

The development server prints its local address. To run the same checks used by CI:

```bash
bun run lint
bun run test
bun run build
```

## Local-only data

The bedtime guestbook stores entries in the current browser's `localStorage`; entries do not sync between different visitors or devices. The mechanical odometer counts local page visits in that browser. It is not a server-wide or unique-visitor analytics counter.

## Suggested interaction smoke test

1. Open each invention and close it with the **Back** button, **Escape**, browser Back, and the backdrop.
2. Change each Nightlight tint in both Day and Night previews and confirm the surrounding scene does not change color.
3. Dispatch to each rooftop, launch the Grand Midnight Tour, confirm the delivered tally increments only after parcel delivery, then use Reset.
4. In Rattle & Block Toys, place and remove shapes, shake a rattle, undo, load a blueprint, run the wobble test, and topple/rebuild. Try rapid clicks during animations.
5. Submit a guestbook entry, refresh the page, and confirm the entry and local visit count persist on the same browser.
