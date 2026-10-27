# Asset della corsa infernale

Versione grafica **1.2.2** — 26/10/2026.

Pixel art infernale dal riferimento approvato: ferro annerito, ruggine, cuoio, emblemi distintivi e luce di lava. Asset raster generati con lo strumento integrato imagegen, convertiti in WebP mantenendo il canale alfa. Specifiche in [PROMPTS-v1.md](PROMPTS-v1.md).

| File | Fotogrammi | Uso |
| --- | --- | --- |
| `vehicles-drive-v1.webp` | 8 per mezzo, 6 righe | Chopper con pilota, pick-up, camion, coupé, fuoristrada, Ape |
| `demon-actions-v1.webp` | 4 per azione, 3 righe | Corsa, attacco, morso |
| `portal-flames-v1.webp` | 8 | Portale gotico con fiamme arancioni |
| `infernal-world-v1.webp` | Panorama | Fortezze, strada e lava con velocità di scorrimento diverse |

`assets/hell-race.js` contiene le bande di origine effettive degli atlanti: le righe della tavola veicoli hanno spaziatura irregolare. Il renderer separa le sagome connesse e normalizza gli otto fotogrammi della stessa riga su tele trasparenti con scala comune. La stessa separazione viene applicata ai 12 fotogrammi del demone, con bande reali che includono corna, muso e mandibola. Questo evita tagli e frammenti delle celle vicine; le pose troncate sul bordo destro della sorgente sono sostituite da una posa completa. La strada ha un velo carbone, mentre lava e cielo mantengono i colori originali. I veicoli attivi partono davanti al demone; in caso di cattura la creatura viene disegnata in primo piano. Le anteprime e i riquadri dei giocatori usano gli stessi sprite della corsa.

Il demone passa dalla corsa all'attacco e al morso nel finale. Il portale compare nella parte conclusiva della partita; nel finale ne viene disegnato uno solo. Polvere e braci completano il movimento. Pausa e sospensione fermano la scena; la preferenza di sistema per il movimento ridotto mostra pose ferme. La grafica non modifica punteggi, turni o salvataggi.

I due asset statici `vehicles.webp` e `demon.webp` della v1.1.0 sono conservati come versione precedente, ma non vengono caricati dalla nuova scena.
