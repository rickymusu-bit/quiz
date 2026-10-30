# 006 — Retake mirato del solo attacco artiglio — v4
Data 2026-10-30 Europe/Rome. Input effettivi: 1 candidates/005_posa_B_v3.png (target, SHA-256 c6eb1f2775ebe18de79f3c6c2beb58885cca4653af65acb422c1ab81d63b05d2); 2 approved/pose_A.png (riferimento canonico invariato). Tool image_gen.imagegen, transparent_background=true, referenced_image_paths=["/workspace/scratch/aa645753c8fe/generated_images/exec-9deaabcb-30be-4783-899e-48279fdcf0f0.png","/workspace/scratch/aa645753c8fe/generated_images/exec-3631d33b-b705-4cf3-8ba8-9a7693003310.png"]. Modello/seed/prompt interno non esposti.
Coordinate target stimate manualmente sul PNG005. Tentativo più specifico dopo fallimento005: rimozione hook interno e attacco al giunto più esterno, coerente col riferimento; nessuna nuova libertà di redesign. Prompt registrato prima della chiamata.

```text
EDIT ONLY THE TWO WING HOOKS IN IMAGE 1. Image 1 is the downstroke image to correct. Image 2 is the unchanged original wings-up design, supplied to identify the corresponding claw-bearing joint and claw design.

The previous edit failed: it kept the hook next to the INNER round wing joint. This is the WRONG attachment for this character. Now make this precise local repair in the wings-DOWN image:

SCREEN LEFT wing, image 1 coordinates on the 1536x1024 canvas:
- Remove the existing hooked projection near (408,574), immediately outside the inner round joint near (447,572). Reconstruct a clean normal bone/membrane edge there. No claw remains at that inner location.
- Reattach that ONE small hooked claw to the NEXT OUTER LARGE JOINT, near (263,700), on the sloping outer leading edge of the wing, substantially farther left and lower than its current attachment. The claw must visibly grow from THAT joint, curve outward/upward away from the membrane, and remain attached by a continuous base. This joint already exists; do not add another joint or lengthen any wing bones.

SCREEN RIGHT wing, mirrored:
- Remove the existing hook near (1128,574), beside the inner joint near (1089,572).
- Reattach the ONE corresponding hook to the existing outer leading-edge joint near (1273,700). It curves outward/upward and has a connected base.

These coordinates are explicit target locations in IMAGE 1, approximate by a few pixels. Move the hook attachment to these outer joints; do NOT leave it on either inner joint. There are exactly TWO wing hooks total, one per wing. Image 2 shows the canonical distal attachment: preserve its joint/branch identity after the wing is lowered. Match the small hook's proportions and material to image 2, not a giant new horn.

EVERYTHING ELSE IN IMAGE 1 IS LOCKED: body position and scale, skull, horns, face, torso, arms, hands, legs, feet, tail, complete lowered wing pose, all existing wing bones and their lengths, the muted dark brown/bronze and burgundy palette, small membrane holes and torn edges, lighting and pixel-art texture. Do not change the body or globally resize the image. Do not brighten or recolor it. Do not swap to wings up.
One complete single character, same 1536x1024 canvas. Genuine transparent background and original alpha holes. No scene, aura, text, labels, guides or duplicate poses. Output only the corrected image 1.
```
