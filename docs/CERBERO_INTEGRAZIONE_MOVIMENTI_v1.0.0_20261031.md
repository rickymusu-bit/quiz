# Hellscape — Integrazione incrementale dei movimenti di Cerbero

**Versione:** v1.0.0  
**Data:** 31 ottobre 2026 (Europe/Rome)  
**Fonte:** richiesta di implementare i movimenti secondo il piano in `assets/hell-race/production/cerbero/capture-v1/PIANO_ASSET_CATTURA_v1.0.0_20261031.md`, usando il tool separato `rickymusu-bit/sprites-post`.  
**Stato:** Gate tecnico della corsa disponibile per revisione; **non** sostituzione approvata della cinematica di cattura.

## Materiale realmente disponibile

- Il ciclo di corsa a otto fotogrammi è archiviato, approvato come pacchetto di asset e tracciato in `assets/hell-race/production/cerbero/run-stabilized-v1/manifest.json`. Il suo nome di archivio non implica che la biomeccanica sia stata convalidata o che il gioco lo usi già.
- L'atlante sorgente della corsa è `assets/hell-race/production/cerbero/run-stabilized-v1/atlas.png` (4×2, celle RGBA 552×522). Immutabili anche `source-sheet.png`, pose, riferimenti, landmark e prompt effettivamente registrati.
- La scena usa una camera logica a vista laterale, Cerbero corre verso destra con `M.CHASE={left:8,ground:303,width:221}`, `M.ROAD_SPEED=48` e `M.STRIDE=32`. Il vecchio renderer a parti articolate resta la sorgente delle trasformazioni delle bocche, necessarie al fuoco e alla cattura.
- Non sono ancora state approvate né archiviate le pose nuove C-B/C-C, varianti V1/V2 o compositi X1/X2 richiesti dal piano della cattura. Vietato simularle con ridimensionamento della bocca o far passare il vecchio morso per il nuovo asset.

## Implementato in questo gate

1. `assets/hell-cerbero-gallop.js` visualizza gli otto fotogrammi approvati senza alterarne i pixel di origine. L'avanzamento è deterministico, ricavato dalla distanza percorsa e quindi coerente con pause e variazioni di velocità. Il periodo nominale è 800 ms a 48 px logici/s, pari a 38,4 px logici per ciclo. **Questa è una taratura di anteprima, non una misura biomeccanica approvata.**
2. Il renderer di prova è richiamabile **solo** durante la corsa ordinaria con `Fool.html?start=1&cerberoGallop=stabilized`. Durante il fuoco il vecchio renderer rimane attivo, perché gli ancoraggi delle tre bocche non sono ancora stati annotati nel nuovo atlante. Durante le catture e le scene finali resta il vecchio renderer. Il passaggio al vecchio disegno durante il fuoco può apparire brusco: è una limitazione nota del prototipo, non una soluzione di produzione.
3. Senza parametro di anteprima il gioco non cambia. Questa scelta permette un confronto diretto prima di rimpiazzare il runtime e non altera punteggi, eliminazioni, tempi di risposta o salvataggi.
4. `tests/cerbero-gallop.test.js` controlla hash degli originali, cardinalità, tempi, regione RGBA e selezione deterministica. `tests/cerbero_gallop_browser.py` produce `artifacts/motion/cerbero-gallop/corsa-browser.png` e `corsa-browser.gif` **da una partita realmente renderizzata nel browser**. Nessuna GIF tecnica dei PNG è presentata come registrazione del gioco.
5. `.github/workflows/cerbero-postprocess.yml` esegue lo strumento **dal repository indipendente**, fissato al commit `870e1274aee5fd42ede786cff7eec944087c7771`, con gli input originali e `landmarks.json` nel repository quiz. Confronta pixel per pixel l'atlante e le otto pose riprodotte con i file archiviati, allegando diagnostiche di CI. Nessuna copia operativa del toolkit viene mantenuta in quiz.

## Gate di accettazione ancora aperti

- **Corsa:** confrontare screenshot/GIF del browser ai file approvati e a velocità di gioco; controllo di piedi, fase di appoggio, posizione relativa al ponte, loop 8→1, oscillazione del torso e raccordo con il fuoco. Necessaria approvazione esplicita prima di rendere la nuova corsa predefinita.
- **Cattura — gate 1:** produrre isolatamente C-A (riuso di posa approvata), C-B (reach), C-C (bite), V0 coupé e il composito X1; fissare gli ancoraggi di mandibola centrale e retro del mezzo nello stesso sistema. Prima controllare l'identità grafica e la qualità delle reference originali; immagini generate senza riferimento reale non superano il gate.
- **Cattura — gate 2:** C-D, C-E, V2 e X2; verifica carico anteriore, frenata, rigidità del mezzo, presa senza slittamento.
- **Cattura — gate 3:** C-F, V4 e livelli separati di fuoco, frammenti e caduta. L'integrazione runtime richiede teste con connessioni anatomicamente corrette e fiamme ancorate alle bocche.
- Il piano prevede prima produzione e approvazione delle pose e poi postprocessing con il tool indipendente: **non** generare automaticamente tutti i fotogrammi intermedi e non fare merge in `main` prima di screenshot, GIF e CI validati.

## Registro variazioni

- **v1.0.0, 31/10/2026:** introdotto adattatore di anteprima per la corsa archiviata, controlli di integrità, acquisizione reale dal browser e workflow di riproducibilità pinning `sprites-post`. Nessuna nuova posa di cattura presentata come esistente.
