# Cerbero — galoppo biomeccanico / scheda v0.2.0 (30 ottobre 2026)

**Stato:** storyboard e bozza spritesheet prodotti fuori dal repository; non ancora validati visivamente né integrati nel runtime. Nessun vecchio asset deve essere rimpiazzato prima di approvazione. Fonti: \`docs/cerbero-v2/README.md\`, \`docs/cerbero/README.md\` (solo riferimento al design approvato, la mesh storica è respinta), \`assets/hell-cerbero-frames.js\` e protocollo v13.

**Design di riferimento:** Cerbero rosso/carnoso a tre teste; vista laterale, corsa verso destra. **Riferimenti approvati nella conversazione:** due PNG separati della posa A (estensione in volo) e B (raccolta/compressione). I file generati nel corso della conversazione devono essere acquisiti e versionati come sorgenti prima di integrare il codice; **non dichiarare che siano già presenti su GitHub**.

## Eventi e storyboard candidato

| Frame | Fase rappresentata | Sorgente/validazione |
| ---: | --- | --- |
| 1 | Sospensione estesa | A approvato, originale conservato |
| 2 | Primo contatto anteriore | Intermedio generato, contatto da verificare |
| 3 | Carico anteriore e recupero posteriori | Intermedio generato, contatto da verificare |
| 4 | Sospensione raccolta | Intermedio generato, deve risultare senza contatti |
| 5 | Inizio appoggio posteriore | B approvato come morfologia; contatto reale da verificare |
| 6 | Spinta posteriore I | Intermedio generato, contatto da verificare |
| 7 | Spinta posteriore II | Intermedio generato, contatto da verificare |
| 8 | Distensione/decollo | Intermedio generato, continuità con 1 da verificare |

**Timing preliminare:** 8 × 115 ms (920 ms/ciclo), **non ancora calibrato** su velocità di avanzamento/ground contact della scena. Il numero di pose e il timing saranno rivisti dopo la verifica biomeccanica. Non inventare forze fisiche né misure quantitative da immagini generate.

**Sorgente provvisoria:** PNG trasparente generato \`Hellscape_Cerbero_Galoppo_v0.2.0_20261030.png\`, cella 880×570, layout 4 colonne × 2 righe; file JSON di metadati, anteprima JPEG a fondo scuro e GIF di prova nel lavoro conversazionale. **Non ancora archiviati in questo repository**. Conservare A e B originali e le pose intermedie come livelli/versioni distinti.

### Check prima dell'integrazione

1. Scala coerente fra A, intermedi e B; non basta normalizzare ogni frame a un bounding box.
2. Quattro arti leggibili, occlusioni e punti di attacco costanti, contatti biomeccanicamente giusti, nessun hovering.
3. Torso che segue le fasi di flessione e di estensione, testa/collo/coda con leggero ritardo.
4. Verifica dell'ordine degli appoggi vicino/lontano, spostamento sul terreno e loop 8→1.
5. PNG alfa realmente trasparente, senza checkerboard impresso; pivot e dimensioni per ogni cella.
6. Solo dopo approvazione: integrazione nel renderer e **screenshot + GIF reali acquisiti dal browser**, CI completa.

**La bozza non sostituisce automaticamente Cerbero v2.** Non cambiare il gameplay, il fuoco o le catture senza apposita revisione.
