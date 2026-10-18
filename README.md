# Pip's Midnight Observatory ✦

A whimsical, early-web-inspired interactive portfolio centered on Pip, a junior dream engineer. The hero features Pip as a real 3D character (Three.js): his glowing eyes follow your cursor, his head turns toward it, and you can tap him to wave, boop his head, or drag to spin him. A keyboard greeting is also supported. The five-scene story—Observatory, Lullaby Lab, Nightlight Workshop, Rooftop Delivery, and Nursery—connects the portfolio's animated worlds into one journey. Each scene has fewer than 150 words, a keyboard-accessible chapter guide, animated SVG artwork, and a reduced-motion presentation. The final scene contains one hidden, replayable Secret Star reveal.

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

## Responsive and accessibility checks

- Check phone widths from 320px upward for horizontal overflow; rotate to landscape and try each invention modal.
- Open and close each invention with its Back/close button, Escape, backdrop, and browser Back, including after rotating the device.
- Use keyboard Tab/Shift+Tab and Enter/Space to find and activate Pip's Secret Star in the final story scene; close with Escape and confirm focus returns to the star. Re-open it to verify the waking animation replays.
- Move the pointer around the page and confirm Pip's pupils and head follow it (also when the pointer is far outside his box); leave the window and confirm he looks around on his own after a few seconds. Tap Pip to make him wave and hop, tap his head to boop it, and drag sideways to spin him (he springs back on release). Press Enter/Space on the focused character to greet. With WebGL unavailable or the 3D chunk failing to load, the hero falls back to the flat character artwork with CSS pointer-tracking eyes; with `prefers-reduced-motion`, the 3D model renders as a still frame.
- At the bottom of the page, select "Not yet — give me a clue" and follow the link back to the final story scene.
- Repeat with interface sound effects muted and with `prefers-reduced-motion: reduce` enabled.
- Use the GitHub Actions Lighthouse report to inspect measured performance, accessibility, best-practices, and SEO scores. Treat 95+ as a target, not a guaranteed score.

## Supabase bedtime guestbook

Bedtime thoughts are stored in `public.bedtime_thoughts` and shared between visitors. The database migration is `supabase/migrations/20261018180000_create_bedtime_thoughts.sql`. It enables Row Level Security (RLS), lets visitors read and submit valid entries, and denies anonymous edits/deletes. The form validates names (1–40 characters) and thoughts (1–280 characters) both in the UI and at the database policy/constraint layer.

Configure these Vite environment variables in local `.env` and in the production hosting environment:

- `VITE_SUPABASE_URL` — project API URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the project's public `sb_publishable_...` key.

Only use the publishable key in browser code. Never use a Supabase secret or `service_role` key in a `VITE_` variable.

For a fresh Supabase project:
1. Run the SQL in `supabase/migrations/20261018180000_create_bedtime_thoughts.sql` using the Supabase SQL Editor or your migrations workflow.
2. Set the two `VITE_SUPABASE_*` variables in the Vercel project (Production, Preview, and Development as needed).
3. Redeploy the site so Vite bundles the public connection settings.

The mechanical odometer is still local to each browser; it is not server-wide or unique-visitor analytics.

## Suggested interaction smoke test

1. Open each invention and close it with the **Back** button, **Escape**, browser Back, and the backdrop.
2. Change each Nightlight tint in both Day and Night previews and confirm the surrounding scene does not change color.
3. Dispatch to each rooftop, launch the Grand Midnight Tour, confirm the delivered tally increments only after parcel delivery, then use Reset.
4. In Rattle & Block Toys, place and remove shapes, shake a rattle, undo, load a blueprint, run the wobble test, and topple/rebuild. Try rapid clicks during animations.
5. Submit a guestbook entry, refresh the page, and confirm the entry and local visit count persist on the same browser.
