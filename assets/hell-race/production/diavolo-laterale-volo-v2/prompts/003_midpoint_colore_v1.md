# Normalizzazione colore M e dimensioni — v1

Data: 30 ottobre 2026. Richiesta: «Va bene, allinea dimensioni e colore». M accettato come posa, da normalizzare.

Input 1: tavola approvata A/B exec-f5e24ce2-2dee-4ce2-8d07-3b4a7e2e028d.png. Input 2 e unico target: midpoint exec-225046d4-a7b8-49ac-af15-1f2574119052.png. Entrambi aperti visivamente prima dell'editing. Strumento generativo integrato, referenced_image_paths con entrambi i file; alpha richiesto. Correzione colore tramite editing; successiva registrazione globale dimensioni/posizione senza deformazioni locali. I PNG originali rimangono immutati.

## Prompt esplicito esatto

Use case: precise-object-edit / color normalization.
IMAGE 1 is the APPROVED two-pose reference sheet (left A wings raised, right B wings lowered). IMAGE 2 is the APPROVED midpoint M and is the ONLY edit target. Return ONLY the single midpoint figure from IMAGE 2 on true transparent background, same full image canvas and composition as image 2.

TASK: harmonize the midpoint's color and shading to match the LEFT endpoint A in image 1: same darker muted oxblood/burgundy flesh, soot-black and weathered bronze metal, bone hue, brown-black wing membranes, restrained orange reflected edge light. Remove any excess pink/red saturation or excessive brightness compared with endpoint A. Preserve dark detail and readable texture. This is a restrained color/exposure correction, NOT a redesign or new animation pose.

LOCK GEOMETRY: keep every outline, body and wing pose, anatomical proportion, expression, horn, tail, claw, armor plate, rivet, chain, tear and hole of image 2 unchanged. Do not change the wing angle. Do not relocate the wing thumb claw from its wrist. Do not add or remove details or body parts. Keep strict right-facing side profile. Do not copy either endpoint's wing pose. Match the reference palette without recoloring all materials into a single color. Preserve genuine alpha transparency including holes. No background, shadow, label, lettering, grid, watermark, extra image or second character.

Subsequent global scale/translation normalization will be done separately from stable body landmarks; do not try to change anatomy or stretch the image to fit the endpoint. Preserve image 2 shape and framing exactly.
