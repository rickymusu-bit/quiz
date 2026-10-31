# Cerbero running with three flame jets

Version 1.0.0 · 2026-10-31 (Europe/Rome). Work in progress.

User request: modify the previous running loop so Cerberus shoots flames while running.
Canonical running frames: ../run-stabilized-v1/frames/001.png … 008.png, main 4876d1a066f31453e844a8932cb12d94529db2ae. Fixed side camera, facing right, eight 100 ms poses, 800 ms loop. Same anatomy, palette, scale and stabilized thorax; no new running poses are needed. The added fire is an independent animated effect layer.

Technique: generate a transparent flame-only atlas, then animate three jets in a browser Canvas at per-frame, individually inspected mouth anchors. Each jet must start at its own mouth and follow it through all eight original running poses. The original body frames remain unchanged. Extra transparent canvas to the right accommodates flame tips without scaling the creature. Capture a real browser GIF and export RGBA frames/atlas for review.

This is isolated asset production, not game integration. Scene placement and actual gameplay rendering scale are not claimed to have been verified. Generated flames and the resulting action remain candidates until user review. The existing game fire renderer in assets/hell-cerbero.js already uses per-mouth anchors and a separate flame atlas; this package follows that separation.

Prompt 001 is recorded before generation in prompts/001_flame-effects_v1.0.0_20261031.md.
