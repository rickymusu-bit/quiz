# Asset della corsa infernale

Versione grafica **1.1.0** — 26/10/2026.

| File | Dimensioni | Uso |
| --- | --- | --- |
| `vehicles.webp` | 216 × 88 px | Sei mezzi, atlante 3 colonne × 2 righe, singola cella 72 × 44 px |
| `demon.webp` | 112 × 76 px | Demone horror inseguitore, PNG originale ottimizzato in WebP |

Ordine delle celle dell'atlante:

| | Colonna 1 | Colonna 2 | Colonna 3 |
|---|---|---|---|
| Prima riga | chopper con pilota | pick-up | camion |
| Seconda riga | coupé | fuoristrada | Ape a tre ruote |

Gli sprite sono orientati verso destra, hanno sfondo trasparente e usano tinte metalliche e terrose con dettagli incandescenti. Le figure includono i simboli identificativi approvati. Il demone ha un aspetto animalesco/horror, senza palette azzurre o viola.

Gli asset ottimizzati servono al rendering nel canvas: `assets/hell-race.js` gestisce movimento, sovrapposizione delle corsie, polvere ed eventi finali. **Non sono fogli di animazione a frame indipendenti**: la versione corrente anima movimento e oscillazione di immagini statiche. Il numero di punti e la logica del gioco non dipendono dalla grafica.

Gli originali grafici ad alta risoluzione v1.1.0 sono conservati nel pacchetto di lavoro separato; qui sono presenti soltanto le risorse necessarie all'applicazione.
