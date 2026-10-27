# Asset della corsa infernale

Versione grafica **1.3.0** — 27/10/2026.

Pixel art infernale dal riferimento approvato: ferro annerito, ruggine, cuoio, emblemi distintivi e luce di lava. Asset raster generati con lo strumento integrato imagegen, convertiti in WebP mantenendo il canale alfa. Specifiche in [PROMPTS-v1.md](PROMPTS-v1.md).

| File | Fotogrammi | Uso |
| --- | --- | --- |
| `vehicles-drive-v1.webp` | 8 per mezzo, 6 righe | Chopper con pilota, pick-up, camion, coupé, fuoristrada, Ape |
| `demon-actions-v1.webp` | 4 per azione, 3 righe | Corsa, attacco, morso |
| `portal-flames-v1.webp` | 8 | Portale gotico con fiamme arancioni |
| `infernal-world-v1.webp` | Panorama | Fortezze, strada e lava con velocità di scorrimento diverse |

`assets/hell-race.js` contiene le bande di origine effettive degli atlanti: le righe della tavola veicoli hanno spaziatura irregolare. Il renderer separa le sagome connesse e normalizza gli otto fotogrammi della stessa riga su tele trasparenti con scala comune. La stessa separazione viene applicata ai 12 fotogrammi del demone, con bande reali che includono corna, muso e mandibola. Questo evita tagli e frammenti delle celle vicine; le pose troncate sul bordo destro della sorgente sono sostituite da una posa completa. La strada ha un velo carbone, mentre lava e cielo mantengono i colori originali. I veicoli attivi partono davanti al demone; in caso di cattura la creatura viene disegnata in primo piano. Le anteprime e i riquadri dei giocatori usano gli stessi sprite della corsa.

Le eliminazioni e i finali sono coordinati da `assets/hell-ending.js`. Il portale appare soltanto quando resta da far fuggire il vincitore; non viene anticipato durante la partita ordinaria. Polvere e braci completano il movimento. Pausa e sospensione fermano la scena; la preferenza di sistema per il movimento ridotto mostra pose ferme. La grafica non modifica punteggi, turni o salvataggi.

I due asset statici `vehicles.webp` e `demon.webp` della v1.1.0 sono conservati come versione precedente, ma non vengono caricati dalla nuova scena.

I nomi sono ancorati sopra il bordo superiore effettivo degli sprite, con almeno 5 pixel logici di spazio. Le corsie distano 80 pixel per separare nomi e veicoli anche a pari punteggio. Le larghezze logiche sono: camion 62, pick-up 58, fuoristrada 56, coupé 54, chopper 44, Ape 40. Ogni mezzo conserva le proporzioni della propria sagoma; le anteprime usano un fattore comune, senza ingrandire separatamente i mezzi piccoli. `tests/vehicle_layout.cjs` controlla le dimensioni realmente disegnate su tutti i fotogrammi, nella cattura e nelle anteprime, e genera `artifacts/vehicle-proportions.png`.

Anche nelle schede giocatore il nome occupa una riga separata sopra l’anteprima del veicolo; punteggio e stato restano a sinistra. Il test browser verifica che i rettangoli di nome e sprite non si sovrappongano in entrambe le orientazioni.

Le ruote sollevano scie di polvere a lobi pixel art, che si espandono, scorrono all’indietro e sfumano; sassolini seguono piccole traiettorie balistiche. L’intensità dipende dal mezzo. I passi alternati del demone, sincronizzati ai quattro fotogrammi di corsa, generano nuvole più pesanti e zolle di terra; attacco e morso hanno impatti localizzati. Gli effetti dipendono soltanto dall’orologio della scena: nessun uso del generatore casuale del gioco, nessuna coda di particelle o timer aggiuntivo. Pausa e movimento ridotto congelano anche polvere e detriti. `tests/hell_dust.cjs` verifica evoluzione, dissolvenza, determinismo, limite delle particelle e isolamento dello stato Canvas.

## Presa, veicolo inghiottito e fiammata — v1.3.0

`demon-ending-v1.webp` aggiunge sedici pose, generate dal demone già approvato: presa con una mano, sollevamento, bocca aperta, masticazione, ruggito e danza. L’originale di generazione è conservato nell’ambiente di lavoro; il WebP è una conversione senza perdita. Come per la corsa, il runtime separa le sagome complete e le normalizza su tele trasparenti senza tagliare mani, corna o piedi. I punti della mano e della bocca collegano il veicolo all’azione.

Il demone afferra l’intero veicolo, lo solleva con una mano e lo porta alle fauci: il mezzo viene inghiottito, segue la masticazione e poi una fiammata verso l’alto. Non rimane un veicolo abbandonato sulla strada. Le fiamme e le scintille sono particelle pixel art sincronizzate alla bocca. La memoria visuale della sessione registra le catture completate, senza scrivere nello stato o nei salvataggi del motore, così un eliminato non ricompare nel finale.

Con un vincitore e nessun avversario ancora da rimuovere, il portale appare improvvisamente; il superstite lo attraversa, il varco si chiude e resta il demone che ruggisce arrabbiato. Se la partita termina per punteggio con altri giocatori attivi, le loro catture e le successive fiammate precedono l’apertura del portale. Senza vincitore viene inghiottito l’ultimo veicolo rimasto, seguita dalla fiammata e dalla danza di vittoria del demone. Le schermate WINS/GAME OVER e i relativi controlli compaiono al termine della sequenza, per non coprire l’azione. Con movimento ridotto si passa direttamente al quadro conclusivo.

`npm run test:endings` verifica le sequenze reali in Chromium, l’assenza di resurrezioni, la continuità dopo un ridisegno UI, pausa, scheda nascosta e movimento ridotto. `python3 tests/endings.py --gifs` genera le GIF in `artifacts/`.
