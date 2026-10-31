# Flame effect generation 001

Version 1.0.0 · 2026-10-31 (Europe/Rome).

Source: main commit 4876d1a066f31453e844a8932cb12d94529db2ae, approved run at assets/hell-race/production/cerbero/run-stabilized-v1/.
Image input: run-stabilized-v1/frames/001.png, unchanged, for style only. The full approved running sequence will be reused unchanged during animation assembly.
Tool: image_gen.imagegen; transparent_background=true; referenced_image_paths contains only that frame. Model-internal instructions, seed and internal processing are not exposed.
Output: candidates/001_flame-effects.png (pending generation). Status: candidate, not approved.

## Exact explicit instruction sent to the generator

Create an EFFECT-ONLY 8-frame spritesheet of a sustained directional hellfire breath jet, with a true transparent alpha background. The attached Cerberus running frame is supplied ONLY as a rendering-style reference. Do not draw any animal, head, mouth, body, teeth, ground or scenery in the output.

The effect will be rendered as three separate jets anchored to the mouths of the EXACT unchanged approved three-headed crimson Cerberus running animation.

Exactly 8 distinct flame sprites in a regular 4-column by 2-row grid, chronological reading order. Each sprite is one connected flame plume pointing from LEFT to RIGHT. Keep each plume entirely inside its own equal-size cell with large transparent gutters; no plume or glow may touch neighboring cells or outer edges. No borders, numbers, text or checkerboard.

Every plume starts at the SAME fixed left-of-cell emission root, very narrow at its origin, then expands into a long, flowing, tapered and curling jet toward the right. Show a brilliant pale yellow core, golden hot center, orange tongues and deep red/orange ragged edges. Match the detailed gothic fantasy sprite rendering and warm palette of the attached character. Flames should be energetic, coherent and drawn as fire, with flowing tongues and turbulent curls; not a solid cone, laser, flat polygon, round explosion or smoke cloud.

Animate a continuous sustained flame stream over all eight frames: small tongues and internal eddies travel outward to the right while the emission root and overall reach stay stable, with modest natural flicker. Frame 8 must transition back to frame 1. No startup/shutdown or blank frames. The base must remain a thin bright emission root with no detached blobs; all flame tongues belong to the connected plume. No detached sparks or embers. A little translucent warm edge glow is allowed, with real alpha and no painted dark halo.

Composition: use a wide overall canvas, with elongated flame plumes and sufficient room for their full tips. Keep all eight plumes at the same base scale. The character in the reference must not appear anywhere in the effect atlas.
