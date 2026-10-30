# 005 — Retake B, colore e attacco artiglio — v3
Data: 30 ottobre 2026 Europe/Rome.
Input effettivi nell'ordine:
1. aligned/004_posa_B_v2_allineata_v1.png — target, SHA-256 34a5e4e562ab9d560972f43f4f3200941c7791d795735c8c28841b89dd0f30f5.
2. approved/pose_A.png — unico riferimento canonico, SHA-256 10439ee3ad19783e4e14d88bec330776809e1ea7a08a6d0fe4ad8228b3da59b3.
Tool: image_gen.imagegen; transparent_background=true; referenced_image_paths=["/workspace/scratch/aa645753c8fe/devil-aligned/004_posa_B_v2_allineata_v1.png","/workspace/scratch/aa645753c8fe/generated_images/exec-3631d33b-b705-4cf3-8ba8-9a7693003310.png"]. Modello, seed, prompt interno non esposti.
Richiesta: «Il colore è differente e l'artiglio dell'ala è su un'altra articolazione».
Coordinate del prompt: stime manuali per identificare i giunti nel riferimento A; non landmark certificati e non coordinate di destinazione per B.
Prompt registrato prima della generazione; confronto GIF obbligatorio dopo l'output.

```text
Use image 1 as the EDIT TARGET: the aligned devil with wings DOWN. Image 2 is the ORIGINAL wings-UP CANONICAL CHARACTER. Output exactly ONE corrected wings-DOWN image, preserving the body size and position of image 1 on its 1536x1024 transparent canvas.

Repair these TWO specific errors. Do not make a new character, do not output wings up, and do not redesign image 2.

1. COLOR CONTINUITY: Image 1 is too bright, orange/gold and saturated compared with image 2. Match image 2's subdued dark charred brown bones/body, muted bronze highlights and deep burgundy membranes, with the same restrained contrast, texture and apparent illumination. In particular remove the conspicuous bright golden-orange glow on shoulders, skull, horns and wing bones. Match each material to the corresponding material of image 2, rather than applying a uniformly black silhouette or inventing different lighting. Preserve the fine drawn details and small transparent holes.

2. WING-CLAW ATTACHMENT / TOPOLOGY: The hooked thumb-claw on each wing must be attached to the SAME HOMOLOGOUS JOINT as in image 2. Follow the continuous wing bone chain from its root on the upper back toward the wing tip, preserving the same number and order of joints and the same branch relationships. A change in wing angle does NOT move the thumb to a different joint.
Study image 2 carefully: on the wing at screen left, the hook-bearing distal articulation is around (407,155), while a separate round articulation closer to the torso is around (574,235), and a further inward bend lies near (611,365). These are approximate image-2 coordinates for identification ONLY, not target positions for the lowered pose. The right wing is the corresponding mirrored structure. Keep the distinction between the hook-bearing distal joint and the inward round joints.
Image 1 simplified that chain and placed the claw on a different articulation. Reconstruct the lowered wing with image 2's SAME chain and branch topology; put its one hooked thumb on the corresponding distal joint, preserving intervening joints and fan of membrane-supporting fingers. Remove the erroneous old hook rather than leaving two claws. Do not simply paste an extra hook or add a long extra segment. Preserve total wing-bone lengths and scale relative to the torso; solve the lowered pose with anatomically plausible bends and foreshortening, not growing the wing. Membranes remain attached to the same bones. Both main wing tips stay below the shoulder line.

Lock all other content to image 1: frontal camera, aligned head/neck/torso/shoulders/pelvis position, horns, arms, hands, bent legs, feet, tail, overall body silhouette, tiny membrane holes and tears. The body may be recolored to match image 2 but must not be reshaped, moved, enlarged or shrunk. Maintain exactly one head, two horns, two arms separate from two wings, two legs and one tail. No new armor, effects or attachments.
ONE isolated full-body character, one downstroke pose only. Genuine transparent alpha background and through the existing tiny holes. No aura, glow, ground, backdrop, labels, grid or text. Entire wings, horns, feet and tail fit inside the canvas with transparent padding.
```
