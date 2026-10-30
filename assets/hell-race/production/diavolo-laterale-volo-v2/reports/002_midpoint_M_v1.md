# Midpoint M v1 — esito e confronto

Data: 30 ottobre 2026. Coppia A/B approvata dall'utente; midpoint ancora candidato.

Input: tavola A/B `exec-f5e24ce2-2dee-4ce2-8d07-3b4a7e2e028d.png`. Output del generatore integrato: `exec-225046d4-a7b8-49ac-af15-1f2574119052.png`, PNG RGBA 1774 × 887, alpha effettivo con valori 0–255. Prompt esatto in ../prompts/002_midpoint_M_v1.md; fornita al tool l'intera tavola con entrambi gli estremi.

Ispezione: una sola figura laterale destra, ali a quota intermedia, stile e ferraglia coerenti in senso generale. Non certificata uguaglianza dei segmenti o dei fori: va giudicato il movimento. M presenta variazioni di scala/inquadratura globali rispetto alla tavola; testa, gambe e sagoma possono mostrare differenze residue. Nessun retake ancora eseguito.

Confronto diagnostico reale dei PNG, A → M → B → M, 550 ms per posa, 800 × 768: `Hellscape_diavolo_A_M_B_v1.0.0_20261030.gif`, salvato come `libfile_c58806edd8488191bb1bad9fa3493ce8`. Nessun morph o frame inventato. A/B separati mediante componenti connessi del canale alpha per evitare di tagliare testa/coda dividendo meccanicamente a metà la tavola; nessun ridisegno. Normalizzazione provvisoria con scala uniforme M=0.64 e traslazioni su canvas 1000 × 960: A=(20,35), M=(-47,160), B=(-822,35); scala finale comune 0.8. Parametri stimati visivamente sul corpo: non sono landmark misurati né una validazione anatomica. Alpha verificato anche sul PNG originale A/B.

GIF ispezionata tramite montaggio dei suoi tre stati prima del salvataggio; quattro frame e dimensioni controllati. È un confronto fra pose, non un ciclo fluido definitivo o una cattura browser. Non integrato nel gioco. I PNG e la GIF sono consegnati nella conversazione; i byte non sono ancora nel fascicolo Git.
