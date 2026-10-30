# Prova spritesheet 10 pose da A/B — v1

30 ottobre 2026. L'utente richiede esplicitamente una generazione multiposa da 10 posizioni partendo da A e B: autorizzazione specifica che supera per questa prova il limite precedente di un frame per chiamata. La sequenza incrementale approvata rimane conservata e non viene sostituita automaticamente.

Interpretazione comunicata: dieci pose di discesa A→B, non dieci pose di un ciclo completo. Ritorno eventualmente riprodotto in senso inverso per diagnosi, senza presumere reversibilità fisica finale. Input: tavola approvata exec-f5e24ce2-2dee-4ce2-8d07-3b4a7e2e028d.png, aperta direttamente, contenente entrambi gli estremi. Generatore integrato, una immagine di riferimento, alpha richiesto. Output candidato da verificare per layout, conteggio e anatomia.

## Prompt esplicito esatto

Use case: identity-preserve / game animation sprite sheet.
Using the attached APPROVED two-pose sheet as the visual identity reference, create ONE production-style transparent SPRITE SHEET containing EXACTLY TEN full-body poses of the SAME horror junkpunk flying devil in STRICT RIGHT-FACING SIDE PROFILE. The input LEFT devil is A, wings fully raised; the input RIGHT devil is B, wings fully lowered. All ten sprites must preserve this exact identity and design.

LAYOUT: a clean regular grid of EXACTLY FIVE COLUMNS and TWO ROWS, ten equal-size cells, order left-to-right across top row then left-to-right across bottom row. Landscape high-resolution canvas, preferably 2560x1536 or a similarly large size with 5x2 equally spaced cells. Exactly one complete devil per cell. Each cell must have the SAME world scale, SAME stationary BODY pivot and SAME head/torso/hip/tail/leg coordinates relative to the cell. Allocate enough fixed padding above and below the body for either extreme and enough width for the entire trailing tail. Nothing may cross a cell border or touch a neighboring sprite. No drawn grid, numbers, captions, labels or lettering. Genuine alpha transparency everywhere outside the figures and inside membrane holes.

ACTION: one monotonic DOWNSTROKE from A to B, NOT an up-and-down loop.
Cell 1 = A, highest raised wings.
Cells 2,3,4 = progressively lower raised-wing poses, each distinct.
Cells 5,6 = distinct central transition poses, wings sweeping backward/outward then downward through shoulder height with physically plausible foreshortening.
Cells 7,8,9 = progressively lower wing poses with the membrane fan diagonally backward/down, approaching B.
Cell 10 = B, lowest dropped wings.
All TEN poses must be visibly different wing articulation stages with smooth incremental progression. Do not repeat raised wings across the whole top row, do not restart the motion in row 2, do not introduce an extra turnaround, do not substitute folded resting wings for the downstroke. The wing wrist/thumb and fan travel continuously down an arc from cell 1 through cell 10. No motion blur, ghosting, blended endpoints or duplicate static sprites.

ANATOMY LOCK: SAME frightening sinewy emaciated burgundy-flesh devil with skull-like snarling profile, two swept-back bony horns, fixed glowing eye, claws, tucked digitigrade hind legs, long thin barbed tail trailing left, sparse riveted corroded dark iron/bronze shoulder, wrist and hip plates, short waist chain. Keep the body's pose, expression, outline and equipment completely stationary across cells; ONLY wing joints and membranes animate. Same two wing roots fixed on upper back. Near bat wing legible, far wing correctly partly occluded. Same upper wing arm, forearm and elongated finger-support bones, with fixed lengths and joint topology. ONE hooked thumb claw stays attached to the WRIST of each wing in EVERY frame, never migrates to the elbow, shoulder, finger tip or the creature's hand. Membranes bend between bones; bones, claws, horns and metal never stretch. Small membrane holes, tears and scars stay on their corresponding panels through all poses. No wing detaches, changes into an arm, intersects the head or gains extra bones. Foreshortening can alter projected size, but do not shrink the whole wing or redraw a different wing design each time.

ART LOCK: match the reference's grim, richly textured dark-fantasy game-sprite paintwork, crisp edges, grotesque horror anatomy and junkpunk salvage armor. Palette consistent across all cells: muted dark oxblood/burgundy flesh, soot black, rusted iron, oxidized bronze, dirty bone, brown-black membranes; subtle warm orange light from below. Same illumination, saturation, contrast, texture density, detail and sharpness throughout the sheet. No cute/chibi/cartoon imp, no dragon redesign, no clean sci-fi robot, no neon colors, no added gore.

This output is a ten-pose atlas candidate built from BOTH endpoint references. Preserve A and B as the endpoint designs, do not replace them with different demons. EXACTLY ten sprites, strict 5x2 equal-cell layout, fully transparent background, no watermark.
