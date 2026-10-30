# P tra N e B — candidato v1

30 ottobre 2026. Richiesta: «Aggiungi un altro frame tra N e B». N accettato per proseguire. Una sola nuova posa P, richiesta a metà circa dell'intervallo geometrico N–B; non equivale a timing definitivo.

Input effettivi: N_allineata_v1.png (normalizzazione descritta in N_registration_v1.json) e B_allineata.png (v1.1.0), entrambi 1000×960 RGBA, aperti visivamente prima della chiamata. Strumento integrato, referenced_image_paths con entrambi; transparent_background=true. Direzione alare esplicitata perché N rimaneva vicino a M. Originali immutati.

## Prompt esplicito esatto

Use case: identity-preserve / one animation inbetween.
You have TWO approved right-facing side-profile sprites of the same horror junkpunk devil, both on a common transparent 1000x960 canvas.
IMAGE 1 is pose N: the wings are still extended backward/left around shoulder height.
IMAGE 2 is endpoint B: the wings are fully lowered below the body.
Produce exactly ONE NEW pose P, genuinely BETWEEN N and B during the DOWNSTROKE. P must have wings visibly substantially LOWER than N, but not as low as B. Do not repeat the wing pose in image 1.

Use IMAGE 2 as the immutable reference for body scale, position, anatomy, shape, palette and shading. Keep skull, face, horns, glowing eye, neck, torso, shoulder plate, arms, hands, tucked legs, hip armor, chain and trailing tail at the same coordinates as B. Strict 90-degree right-facing side profile, no camera rotation, no zoom, no reframing. Only the anatomical wings change pose.

Important intermediate mechanics: the near wing shoulder ROOT stays fixed on the upper back. Rotate the entire articulated wing DOWN through the true shoulder joint, with plausible elbow and wrist articulation and constant bone lengths. Place the hooked wing-thumb WRIST joint around lower-chest/upper-abdomen height, visibly below the shoulder plate: approximately x=720,y=525 in the 1000x960 reference canvas. For comparison, the near wrist in N is approximately x=635,y=390 and in B approximately x=805,y=650. These are approximate guides for the same side camera, not permission to stretch anatomy. From the lowered wrist the large membrane fan and long supporting fingers spread diagonally BACK AND DOWN toward the lower-left: a clearly descending diagonal silhouette, between N's near-horizontal wing fan and B's vertically dropped fan. The longest distal fingers should extend toward roughly x=430-550,y=720-800, while all tips stay inside generous margins. Keep the membrane open enough to read the bat-wing structure, not pressed flat against the torso. Show the upper wing arm connecting to the upper-back root without detaching or intersecting the chest. Do not relocate the wing-thumb claw to an elbow, finger tip, or the creature's hand.

The far wing follows the same downward beat with natural occlusion behind torso/near wing; exactly two anatomically connected wings, not extra arms. Preserve the same count and lengths of wing bones and finger supports, membrane panels, persistent small holes, scarred tears and ragged edges; do not add ribs, horns, armor or chains. Body bones, claws and metal are rigid; only the membrane bends and changes projection. No outlines stretched by 2D scaling; no crossfade or blended duplicates.

Keep the exact grim realistic game-sprite texture: dark muted oxblood skin, soot-black rusted iron, oxidized bronze, dirty bone, brown-black tattered membranes, restrained warm reflected light below. Not cartoon, not cute, no additional gore. Genuine transparent alpha including holes. One full isolated devil, no scenery, ground, shadow, text, frame, label, grid, watermark, additional pose or endpoint copies. Same canvas and padding; nothing cropped.
