# PR B — spareggio

Sorgente di HTML, GIF e screenshot: `a23546f4102921956f00ed7a9d59832bdb70c6d3`.

Screenshot originali dall’HTML autonomo. L’introduzione è acquisita in pausa; il pulsante Riprendi scena corrisponde a quello stato. La versione verticale usa il letterbox sopra la scena, mantenendo visibile tutta la corsa.

Le acquisizioni locali sono generate dalla suite `--quick`: due viewport e tutti i contratti di flusso. La CI esegue la suite completa a cinque viewport/DPR 1/2 e include PNG, GIF ed export: https://github.com/rickymusu-bit/quiz/actions/runs/40650069838#artifacts.

Rigenerazione completa: `npm run test:ties`. Nell’export `dist/Hellscape-review.html`: **Scenari di revisione → Intro spareggio (3)**, **Intro spareggio (2)**, **Nuovo giro**, **Eliminazione (in pausa)**. I controlli sono esclusivi della revisione. Questo ramo aggiunge soltanto documenti alla sorgente della PR #33 e non viene unito a main.
