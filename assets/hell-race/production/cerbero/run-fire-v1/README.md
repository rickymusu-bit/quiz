# Cerbero running with three flame jets

Version 1.2.0 · 2026-10-31 (Europe/Rome). Candidate for user visual review.

This action reuses the approved stabilized running loop from main commit `4876d1a066f31453e844a8932cb12d94529db2ae`, at `../run-stabilized-v1/`. All eight original RGBA running files remain unchanged. They render at scale 1, offset (0,0), with the same 100 ms pose timing and 800 ms loop. Fixed side camera, facing right; the stabilized torso and all three heads remain those of the accepted run.

## Preview and export

- `spritesheet/run-fire-loop.gif`: real Chromium capture of this isolated animation, 880 × 522 viewport, 16 samples × 50 ms, 800 ms infinite loop.
- `spritesheet/run-fire-atlas.png`: true-alpha 4-column × 4-row sheet, 3520 × 2088, sixteen 880 × 522 cells in reading order. Each pair of cells uses one original running pose while the fire advances independently.
- `candidates/001_flame-effects.png`: original generated eight-frame effect-only atlas, unchanged; no Cerberus body was generated or redrawn.
- `mouth-anchors.json`: all 24 individually inspected mouth positions, three persistent head IDs, jet directions/lengths and phase offsets.
- `flame-atlas.json`: exact source rectangles and emission roots for each of the eight flame variants.
- `prompts/001_flame-effects_v1.0.0_20261031.md`: exact explicit generation instruction, saved in the branch before the tool call, plus factual result metadata appended afterward. Internal generator instructions and seed are not exposed.
- `reports/render_fire_v1.py`: browser renderer, capture and verification source.
- `reports/browser-report.json`: source hashes, all 48 emitted-jet transforms, actual clip timing and checks.
- `reports/browser-frame-001.png` and `reports/mouth-anchor-check.png`: real browser screenshots of the candidate and its inspected emission markers.
- `manifest.json`: portable paths, hashes, atlas mapping and per-sample source poses/emissions.

## Technique

Generated fire is an independent visual layer. The unchanged reference frame `../run-stabilized-v1/frames/001.png` supplied rendering style to image_gen.imagegen. No new running pose, rig, body deformation or interpolation was used. Jet roots follow the upper, middle and lower mouths in every original pose, with each direction derived from that head’s annotated rear-to-front muzzle axis in that body pose. Body poses advance every 100 ms; flame frames advance every 50 ms with phase offsets between heads, producing sustained breathing while running. The canvas expands only to the right to contain the full flame tips.

The existing game fire renderer in `assets/hell-cerbero.js` also separates mouth anchors from the flame atlas; this package uses that same organization for isolated asset review. It does not alter the game renderer, the 60-second game fire trigger or published gameplay.

## Validation and limits

Verified all eight source body hashes unchanged, identical body transform in all 16 samples, three emitters per sample, exact mathematical correspondence of each effect root to its annotated mouth and forward-direction agreement with its own muzzle axis, zero browser page errors, uniform RGBA exports, actual 16 × 50 ms GIF timing, atlas cells identical to the Canvas frame exports, and no high-alpha silhouette clipping at the output canvas edges. The export and browser contact images were visually inspected.

Mouth locations are visual estimates with approximately 3 px uncertainty. Numerical attachment checks verify rendering against those annotations, not anatomical correctness independently of them. Source pose/contact limitations of the running sheet remain documented in `../run-stabilized-v1/README.md`. Actual gameplay scale, scene placement and game integration have not been tested; the GIF is a real browser capture of an isolated Canvas review, not a recording of the integrated game. This new firing action awaits user approval.

## Reproduce

From repository root, with Pillow, Playwright and Chromium available:

```bash
python3 assets/hell-race/production/cerbero/run-fire-v1/reports/render_fire_v1.py
```

`CHROMIUM_PATH` may select the Chromium executable; the default is `/usr/bin/chromium`. The script uses a temporary localhost HTTP server and writes new PNG frame exports, its internal HTML viewer, screenshots, GIF and report to ignored `artifacts/cerbero/run-fire-v1/`. HTML is internal rendering infrastructure, not a delivered preview. No runtime integration or source image modification occurs.

## Direction correction requested by the user

The first assembly used fixed upper/middle/lower spread angles. The user required each flame to emerge from its mouth in the direction of that head. Version 1.2.0 re-inspects all 24 mouth centers and records a separate muzzle-axis point pair for every head and every running pose. The renderer derives its angle from that pair instead of a fixed fan. Both the emission root and the +X direction of the flame are checked against the respective mouth and forward muzzle axis in all 48 rendered emissions. `reports/rejected-fixed-spread.json` preserves the cause, previous settings and diagnostic hash; the rejected preview remains a local artifact and is not the delivered loop.

## Leading-head mouth correction

The user identified the foremost (lower/rightmost) jet as originating at its nose. Version 1.2.0 lowers only that head’s mouth Y coordinate in each of the eight source poses, after inspection of enlarged mouth crops. Its horizontal anchor and muzzle direction remain the same; upper/middle head annotations and the original running sequence are unchanged. `reports/leading-mouth-correction.json` records the old and new coordinates. The browser capture, atlas, mathematical attachment checks and no-clipping checks were rerun.
