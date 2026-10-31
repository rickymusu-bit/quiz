# Cerbero — corsa con torace stabilizzato

Versione 1.0.0 · 31 ottobre 2026 · Hellscape – Fuga dall'inferno.

Pacchetto del risultato mostrato e accettato dall'utente: «Perfect. Save it on the assets in the main branch». Conserva esattamente i PNG e le GIF della revisione, senza una nuova generazione o ricodifica. L'approvazione riguarda il salvataggio di questo risultato stabilizzato; l'integrazione nel gioco resta una fase distinta.

## File principali

- `atlas.png`: spritesheet RGBA, 4 colonne × 2 righe, 2208 × 1044 px.
- `frames/001.png` … `008.png`: otto pose, ciascuna 552 × 522 px, ordine cronologico.
- `loop.gif`: ciclo completo mostrato, 100 ms per posa, 800 ms totali, ripetizione continua.
- `frames-4-5-6-slow.gif`: dettaglio numerato delle pose 4–6, 450 ms per posa, 1350 ms totali.
- `source-sheet.png`: seconda tavola generata, conservata byte per byte prima dell'allineamento.
- `landmarks.json`: punti toracici annotati e configurazione effettivamente usata.
- `references/`: A/B approvate e prompt sorgente della PR #93, commit `c43e2316c9dfe836eb0bce5c3ed5f890274ffb7f`, conservati invariati.
- `prompts/002_sheet_v1.0.0_20261030.md`: istruzione esplicita effettiva della seconda generazione e riferimenti allegati. Il prompt interno del generatore e il seed non sono esposti.
- `reports/alignment-original.json`: rapporto originale dello script, con matrici, residui, ancoraggi e hash. I percorsi `artifacts/` sono quelli storici della lavorazione; usare i percorsi portabili del manifest per questo pacchetto.
- `reports/sprite_postprocess_source_v1.py`: snapshot immutato dello strumento usato, identico a `scripts/sprite_postprocess.py` della PR #94, commit `e25dcfec976496e734db3152f754b132ed6cec83`. È una sorgente di riproduzione storica, non una seconda copia da mantenere.
- `manifest.json`: collegamenti portabili, hash dei file, griglia, tempi, trasformazioni e stato della revisione.

## Tecnica e limiti

Vista laterale fissa, Cerbero rosso/carnoso rivolto a destra. Tre teste collegate, quattro arti articolati, coda e spine rimangono quelli dei disegni generati; nessuna parte anatomica è stata ridisegnata durante l'allineamento.

Il confronto automatico della texture aveva collocato la posa 4 troppo in alto, la 5 troppo in basso e la 6 nuovamente più in alto. Questa revisione usa tre punti del torace stimati visivamente, con incertezza dichiarata di circa 8 px, per una sola traslazione globale di ogni posa. Scala uniforme 1, rotazione 0, nessun warp o trasformazione separata degli arti. La media dei punti toracici è tenuta ferma in tutte le pose per isolare le variazioni del disegno: è una stabilizzazione diagnostica, non una traiettoria fisica definitiva del baricentro.

Le pose 4–6 intendono rappresentare raccolta in volo, primo contatto posteriore e sostegno/propulsione. Ordine dei contatti e trasferimento del peso restano poco leggibili nei disegni e richiedono una revisione anatomica separata. Non considerare i piccoli residui dei landmark una certificazione biomeccanica. Scala di utilizzo, collocazione nella scena e integrazione runtime non sono state verificate in questa consegna.

## Riproduzione

Dalla radice del repository, con Python e Pillow:

```bash
python3 assets/hell-race/production/cerbero/run-stabilized-v1/reports/sprite_postprocess_source_v1.py \
  assets/hell-race/production/cerbero/run-stabilized-v1/source-sheet.png \
  --columns 4 --rows 2 \
  --landmarks assets/hell-race/production/cerbero/run-stabilized-v1/landmarks.json \
  --duration 100 --out artifacts/cerbero/reproduce-stabilized-v1
```

L'output deve essere una directory nuova o vuota. L'atlante e i frame salvati mantengono alfa reale; le GIF diagnostiche usano una palette condivisa su fondo scuro. La GIF rallentata aggiunge soltanto numeri di frame e durata di 450 ms alle pose 4–6; non crea intermedi.

## Verifica di archiviazione

Verificati copia byte per byte degli artefatti mostrati, hash degli input e dello script, otto frame RGBA omogenei, corrispondenza pixel tra frame e celle dell'atlante, matrice globale e centro toracico comuni, griglia 4×2 e numero/durate delle GIF. Le GIF sono diagnostiche derivate dai PNG, non registrazioni del browser. Questo commit aggiunge materiale di produzione; nessun asset runtime viene sostituito e nessun codice di gioco cambia.
