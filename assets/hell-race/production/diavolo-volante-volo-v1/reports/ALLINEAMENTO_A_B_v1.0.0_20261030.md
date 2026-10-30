# Allineamento A originale / B v2 — v1.0.0 — 30/10/2026

Richiesta: «proviamo ad allineare il secondo fotogramma al primo». Applicazione tecnica di §4.1 del protocollo v10; non una nuova generazione IA.
Riferimento immutato: candidates/001_design_A_v1.png, SHA-256 10439ee3ad19783e4e14d88bec330776809e1ea7a08a6d0fe4ad8228b3da59b3.
Target originale immutato: candidates/004_posa_B_v2.png, SHA-256 b2272812ade507323c9aaa862bfb4bc39895bdc2b6eda7c54b0dff6de6329374.
Derivato: aligned/004_posa_B_v2_allineata_v1.png, SHA-256 34a5e4e562ab9d560972f43f4f3200941c7791d795735c8c28841b89dd0f30f5.

## Metodo e risultato
Annotati manualmente quattro punti corporei visibili: centri delle spalle sullo schermo, centro dello sterno e bacino. Coordinate e pesi nel JSON; incertezza visuale stimata circa ±5 pixel sorgente. Non sono landmark prodotti automaticamente da un rig.
Adattamento ai minimi quadrati pesati, con rotazione bloccata a zero. Scala uniforme 0.873861 (circa 87.39%); traslazione [95.621, 173.237] pixel. Un'unica trasformazione affine globale isotropa sul PNG intero, ricampionamento bicubico una volta dall'originale, canvas trasparente comune 1536×1024. Nessun intervento separato su ali, testa o arti.
Pivot corporeo target [769.737, 398.263] trasformato sul pivot riferimento [768.263, 521.263]. Nessun ancoraggio di effetti era stato annotato: non dichiarati ancoraggi trasformati inesistenti. Conservata l'articolazione ad ali abbassate; nessun movimento intenzionale applicato al corpo in questa prova.
Scarto RMS pesato sui punti annotati: 123.55 → 0.99 pixel sorgente; massimo dopo fit 1.41 pixel. Il residuo è inferiore all'incertezza delle annotazioni e non costituisce una precisione anatomica certificata.
Per la sola mappatura provvisoria dell'intero frame a 64 pixel logici e scale .48–.61 del renderer, massimo residuo calcolato circa .03–.04 pixel logici. Il dato dipende dalla futura politica di crop/esportazione; nessuna verifica runtime eseguita.

## Verifiche effettive
- PNG riaperto: 1536×1024 RGBA, alpha 0–255; sagoma alpha>24 entro [220,338,1313,932], nessuna parte sostanziale tagliata.
- Ispezionate sovrapposizione semitrasparente dei due PNG con landmark e vista del secondo frame. Il corpo risulta meglio registrato; le ali divergono come previsto dalla diversa posa.
- GIF reports/gifs/confronto_A_B_allineata_v1.gif: due immagini reali, 768×512, 650 ms ciascuna, loop 1.3 s. Riaperta e verificata per dimensioni, numero frame e durate. Nessuna dissolvenza o interpolazione inventata.
- Fonte e target grezzi conservati; il derivato normalizzato è un file distinto.

Esito: **allineamento globale completato**. Il risultato non rende automaticamente uguali ossa, membrane e dettagli tra pose; giudizio anatomico e approvazione artistica restano separati. Non creati intermedi, non integrato il gioco e non eseguito merge.

Script riproducibile: reports/align_devil_frames_v1.py (Python, Pillow, NumPy). Argomenti --reference, --target e --out. Esempio dal fascicolo dell'asset: python reports/align_devil_frames_v1.py --reference candidates/001_design_A_v1.png --target candidates/004_posa_B_v2.png --out artifacts/alignment; lo script produce PNG, GIF, overlay e metadati nello staging indicato. Per la consegna sono versionati soltanto PNG normalizzato, GIF canonica, script, rapporto e JSON.
