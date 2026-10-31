# Cerbero — generation 002

Source: PR #93, commit c43e2316c9dfe836eb0bce5c3ed5f890274ffb7f.
Inputs: only approved A.png then B.png, unchanged. Generation 001 is not an input.
Retake reason: first result crosses equal-column boundaries and varies anatomical scale. This retake adds layout/registration and contact-order clarification to the source prompt.
Tool: image_gen.imagegen; transparent_background=true. Seed and internal processing not exposed.
Status: candidate; no approval or game integration.

## Exact explicit prompt

Use the two attached images as authoritative visual references for the same Cerberus character.

- **Reference A:** approved fully extended airborne gallop pose.
- **Reference B:** approved compressed running pose. Preserve its anatomy and appearance, but do not mistake a grounded crouch for airborne suspension.

**TASK**

Create one production-quality 8-frame sprite sheet of Cerberus performing a biomechanically accurate, fast rotary gallop with two aerial phases.

Arrange exactly 8 distinct frames in a 4-column × 2-row grid, chronological order from left to right, top to bottom.

**CHARACTER CONSISTENCY — HIGHEST PRIORITY**

Preserve the exact same three-headed crimson hellhound in every frame: anatomy, body proportions, three connected necks, horns, teeth, skeletal spikes, exposed musculature, four articulated legs, claws and spiked tail.

Use identical color palette, lighting direction, shading, material textures, detail level, camera angle and base scale throughout.

No redesigns, missing limbs, extra limbs, shifting horns, inconsistent colors or arbitrary anatomical deformation.

**BIOMECHANICAL SEQUENCE**

1. Extended aerial suspension — body elongated, front legs reaching forward, hind legs extended backward.
2. First front-leg contact — one forepaw lands and begins absorbing impact.
3. Front-leg loading — the other foreleg follows; shoulders lower, spine begins flexing, hind legs swing forward.
4. Gathered aerial suspension — all four paws leave the ground; spine maximally flexed, legs folded beneath the torso.
5. First hind-leg contact — one hind paw lands under the body.
6. Second hind-leg contact and propulsion — the second hind leg joins the support sequence; hips rise.
7. Powerful hind-leg push-off — hind limbs extend, spine lengthens, front legs reach forward.
8. Early extended aerial suspension — all paws airborne, body extending naturally toward frame 1.

Maintain physically plausible joint angles, body weight transfer, footfall order, center-of-mass motion and spinal flexion.

The three heads follow the torso with subtle inertial lag. The tail follows the pelvis. No floating anatomical parts.

**SPRITE SHEET REQUIREMENTS**

- Fixed side-view camera, facing right.
- Entire creature visible in every cell.
- Identical cell dimensions, consistent anatomical scale and registration.
- No duplicated frames or mirrored shortcuts.
- Frame 8 transitions smoothly into frame 1.
- Transparent background with true alpha.
- No ground, checkerboard pattern, shadows, labels, borders, fire or other characters.

**FINAL QUALITY CHECK**

Before finalizing, compare all eight frames against references A and B for consistent identity, colors and anatomy. Ensure every frame depicts a distinct and physically meaningful movement phase.

Prioritize biomechanical correctness and consistency over dramatic posing or decorative detail.

LAYOUT AND REGISTRATION CLARIFICATION:
Use a wide 2:1 canvas, with FOUR EXACTLY EQUAL WIDTH COLUMNS and TWO EXACTLY EQUAL HEIGHT ROWS. Each cell is square. For example a 2048 x 1024 sheet has 512 x 512 cells. Fit the ENTIRE maximum-extended creature inside 88% of the cell width, preserving transparent margins on all four sides. Never let any tail, horn, head, paw or claw cross a cell boundary or the outer canvas edge. Keep the SAME anatomical scale across all eight cells: compressed poses occupy LESS width, never enlarge compressed poses to fill their cell. Register each pose by the torso/pelvis in the same local coordinate system and use one consistent virtual ground level within each row. No visible grid lines. The limbs must be separately articulated with readable contact events: frame 2 forepaw contact, frame 3 foreleg support and hind legs swinging forward, frame 4 true airborne gathered suspension, frame 5 first hind paw under the pelvis, frame 6 hind support/propulsion, frame 7 hind extension push-off, frame 8 airborne elongation. Preserve the reference's three connected heads and four legs. Before returning, check all eight equal cells for padding, anatomical size, support order and complete unclipped silhouettes.
