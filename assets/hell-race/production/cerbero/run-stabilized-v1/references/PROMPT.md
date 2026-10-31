# Cerbero — corsa: prompt di produzione

**Versione:** 1.0.0  
**Data:** 30 ottobre 2026  
**Progetto:** Hellscape – Fuga dall'inferno  
**Stato:** prompt approvato come istruzione di generazione; **nessuno spritesheet è approvato**.  
**Input obbligatori:** soltanto `A.png` e `B.png`, allegati al generatore nell'ordine corrispondente.  
**Output richiesto:** un unico spritesheet con otto pose biomeccanicamente significative; la generazione deve essere validata prima dell'integrazione.

## Provenienza dei riferimenti approvati

- `A.png`: posa di sospensione estesa approvata dall'utente. PNG RGBA originale 1300 × 724, SHA-256 `1dd2abb6794f08d0b9551327dd2cd91e65cb8e8b14231202c4a1ec3924a4f5df`.
- `B.png`: posa di raccolta/compressione approvata dall'utente. PNG RGBA originale 1300 × 724, SHA-256 `89744c161b69f9ccf8782f823eeff7199365497b1f4a181cfbd6c50a00799d2d`.

**Non usare** gli spritesheet precedenti scartati o pose M non approvate come input. Il prompt descrive una richiesta, non garantisce che un generatore produca una biomeccanica corretta.

---

## Prompt per il generatore (English)

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

---

## Gate prima di usare nel gioco

Non fare merge di un nuovo spritesheet senza controllare anatomia, continuità cromatica, ordine dei contatti, flessione della colonna, fase di volo e transizione 8→1. Il gioco attuale non va modificato per il solo deposito dei riferimenti.

