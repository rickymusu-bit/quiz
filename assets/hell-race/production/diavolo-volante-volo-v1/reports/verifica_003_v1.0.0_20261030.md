# Verifica 003 — v1.0.0 — 20261030

- PNG originale 1536×1024, RGBA, alpha 0–254, SHA-256 5bae4b2ae1f4379a7a10f6389850b7034fc1570bd9108988668b9aad40eebbdc.
- Input effettivo: solo approved/pose_A.png; prompt esplicito conservato prima della chiamata in prompts/003_design_A_v2.md. Tool image_gen.imagegen, nessun modello/seed/ID interno esposto.
- Fori: ispezione visiva più campioni alpha dentro le perforazioni: (304,211)=0; (420,230)=2; (446,315)=2; (534,380)=3; (1100,227)=1; (1217,215)=0; (1086,307)=1. Sono aperture trasparenti/quasi trasparenti, non macchie nere opache.
- Il generatore ha anche ridisegnato leggermente corpo, testa e giunti: non è una modifica pixel-identica delle sole membrane. Differenze e registrazione visibili nella GIF; non attestata conservazione esatta delle lunghezze. Stato: candidata di revisione, non design approvato né base autorizzata per gli intermedi.
- B v1 resta RESPINTA: le ali si allungano e le membrane non preservano la topologia. Correggere B dopo la revisione del riferimento; non basta traslare il busto.

## GIF effettive dei PNG
reports/gifs/confronto_A_v1_A_v2.gif: A v1 ↔ A v2 candidata.
reports/gifs/confronto_A_B_respinta_v1.gif: A v1 ↔ B v1 respinta.
Ciascuna GIF ha 2 frame 768×550, durate 650+650 ms, loop 1,3 s; controllati numero frame, dimensioni e durate riaprendo i file Pillow. Nessun morph/crossfade o posa inventata.
I PNG originali sono immutati: solo traslazione rigida su canvas comune, checkerboard di verifica alpha e stessa riduzione uniforme 50% per tutte le immagini. Offset B +60 px e A2 +14 px stimati visivamente, non landmark certificati.
Queste GIF mostrano l'alternanza diagnostica; non attestano fluidità del volo, timing definitivo, identità anatomica o integrazione nel gioco. La verifica alla scala runtime e il loop disegnato restano da fare.

## Rettifica utente
Tentativo 003 respinto: modifica non richiesta del design A e fori ingranditi. L'intento era mantenere i piccoli fori originali nella sola posa B. GIF confronto_A_v1_A_v2.gif eliminata su richiesta; i riferimenti sopra descrivono soltanto l'output storico, non un file ancora consegnabile. Nessuna approvazione di 003. Ripartire da A originale.
