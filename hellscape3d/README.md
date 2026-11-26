# Hellscape 3D

Redesign descritto in [Città procedurali 3D e regia di gioco](../docs/HELLSCAPE_PROCEDURAL_3D_CITIES.md). Il runtime pubblicato (`index.html`, `assets/`) non usa questo codice e non viene modificato; nemmeno i salvataggi `fool-v1` e `fool-settings-v1`. La pagina di prova della fase 2 non è pubblicata.

Stato (§9 della specifica):
- **fase 1, modello logico e test:** completata;
- **fase 2, graybox 3D modulare con camera:** in corso. Primo passo consegnato: layout spaziale, volumi graybox, nebbia di guerra nella scena, vista a tre quarti e panoramica. Mancano movimento animato delle pedine, CameraDirector con transizioni fra giocatori, interfaccia provvisoria con domande fittizie e minimappa.

Il codice è TypeScript con sola sintassi cancellabile. Il modello logico e il layout girano direttamente in Node (≥ 22.18) senza compilazione; la pagina di prova usa Vite e Three.js.

```sh
npm run test:hellscape3d           # controllo dei tipi e test Node (logica, layout, scena)
npm run test:hellscape3d:browser   # build Vite e verifica in Chromium, desktop e mobile orizzontale
npm run dev:hellscape3d            # pagina di prova su http://127.0.0.1:5173
npm test                           # suite core completa, che comprende i test Node
```

## Moduli (`src/logic/`)

| Modulo | Responsabilità |
| --- | --- |
| `rng.ts` | sfc32 con flussi nominati derivati dal seed (`map:N`, `dice`, `simulation:N`); lo stato è serializzabile |
| `config.ts` | configurazione del generatore, valori predefiniti, `GENERATOR_VERSION` |
| `generator.ts` | MapGenerator: rete deterministica da seed, tema e configurazione; tentativi e fallback |
| `validate.ts` | validazione strutturale e di bilanciamento, ricalcolata dalle sole celle |
| `balance.ts` | turni attesi esatti (programmazione dinamica sul grafo aciclico) |
| `engine.ts`, `state.ts` | GameState, azioni, eventi e macchina a stati del turno |
| `exploration.ts` | nebbia di guerra collettiva e vista pubblica per HUD, minimappa e regia |
| `persistence.ts` | salvataggio nella chiave `hellscape3d-save`, ripresa e rifiuto dei salvataggi incompatibili |
| `simulate.ts` | simulazioni Monte Carlo sul motore reale |
| `themes/` | parte logica dei temi; per ora soltanto Megastrutture (distretti e caselle speciali) |

## Graybox (fase 2, primo passo)

| Modulo | Responsabilità |
| --- | --- |
| `layout/layout.ts` | CityBuilder spaziale: posizioni 3D delle caselle, verifica degli ingombri, masse edilizie |
| `scene/model.ts` | modello puro della scena visibile, ricavato dalla vista pubblica |
| `render/graybox.ts` | renderer Three.js: istanze per caselle, passerelle, piloni e masse; camera a tre quarti |
| `main.ts`, `index.html` | pagina di prova non pubblicata |

**Layout.** La rete viene scomposta in corridoi e bivi. Il percorso avanza sempre lungo X, con svolte di 90° verso ±Z e rampe di 1,5 unità; le caselle distano 4 unità. Ai bivi il ramo più breve procede diritto e diventa una passerella sopraelevata; gli altri escono di lato, procedono paralleli e rientrano, eventualmente a una quota più bassa. I rami sono percorsi su griglia: se lo scarto rispetto al ramo breve è dispari, l'ultimo passo è diagonale. Così nessuna casella cade a metà di un angolo, dove disterebbe dalla precedente solo 2,83 unità e le piastrelle si sovrapporrebbero.

Ogni disposizione viene verificata: distanza minima fra caselle, passerelle che non si toccano né attraversano caselle (salvo 3,5 unità di dislivello), lunghezza dei tratti e pendenza. Se 12 tentativi falliscono si usa la disposizione rettilinea, valida per costruzione e verificata comunque. Su 300 città di prova è servita una volta. Il layout usa i flussi pseudocasuali `layout:N` e `decor:masses`, separati da quelli della logica, e non modifica la mappa. Le masse edilizie restano ad almeno 4,5 unità dal percorso; dal lato della camera sono più basse del percorso, per non coprirlo.

**Nebbia di guerra nella scena.** Il renderer disegna solo il modello della scena, costruito dalla vista pubblica: caselle esplorate, passerelle fra caselle esplorate, masse entro 16 unità da esse e, per ogni tratto che prosegue nella nebbia, un moncone pari al 40% della passerella. La direzione del moncone è l'unico dato non pubblico usato, ed è visibile solo per quel 40%. Un test verifica che nessun identificativo di cella nascosta compaia nel modello in alcun momento della partita.

**Pagina di prova.** Parametri: `?seed=…`, `?steps=N` (azioni automatiche iniziali), `?view=overview` (panoramica delle zone esplorate) e `?reveal=all`, che mostra l'intera città **solo per lo sviluppo**, per giudicare il layout. Tasti: Spazio esegue un'azione automatica, V cambia inquadratura. Le risposte sono simulate con il profilo provvisorio; le domande fittizie arriveranno con l'interfaccia provvisoria.

## Rete generata

Sequenza di corridoi e bivi; i rami di ogni bivio (2 o 3) si ricongiungono all'inizio del corridoio successivo. La rete è aciclica, ogni cella è raggiungibile dalla partenza e raggiunge l'uscita. Il ramo più corto ha domande difficili, il più lungo facili, l'eventuale intermedio medie. La lunghezza relativa si basa sulla minima distanza residua verso l'uscita dopo la scelta, come indicato dalla specifica. Le lunghezze di due rami dello stesso bivio differiscono di almeno due caselle.

Gli identificativi delle celle sono opachi e assegnati da una permutazione casuale: non rivelano l'ordine di costruzione né le distanze. L'uscita è nel distretto «Sommità», gli altri distretti si distribuiscono in base al seed. A parità di seed, tema, configurazione e versione del generatore la mappa è identica; l'impronta (`fingerprint`) lo verifica.

Se nessuno dei tentativi (6 per impostazione predefinita) supera la validazione completa, si usa una disposizione prudente che deve almeno superare quella strutturale; altrimenti viene sollevato un errore invece di avviare una partita difettosa. Su 1000 seed di prova non è mai servito il fallback.

### Bilanciamento

Per ogni bivio si calcolano i turni attesi dalla partenza imponendo ciascun ramo, con scelta ottimale agli altri bivi. Lo scarto fra le alternative non deve superare 0,6 turni. Il generatore sceglie le lunghezze costruendo la rete all'indietro dall'uscita, così che il valore a valle sia già noto.

Un primo criterio confrontava i rami soltanto per chi inizia il turno sul bivio. Le simulazioni hanno mostrato che così il ramo breve risultava sistematicamente favorito: chi sceglieva sempre il ramo lungo impiegava fino al 12% di turni in più. Il caso più frequente è infatti l'attraversamento durante l'avanzamento: i passi già guadagnati con una domanda media valgono di più su un ramo difficile. Il criterio attuale tiene conto di entrambi i casi. Su 40 mappe, con 1000 partite simulate per strategia, «sempre il più breve», «sempre il più lungo» e «casuale» differiscono in mediana del 2% di turni medi e al massimo del 6%; la strategia migliore cambia da una mappa all'altra.

Il calcolo dipende dal profilo ipotetico di risposta corretta (facile 0,85, media 0,65, difficile 0,45) e ignora gli effetti delle caselle speciali, non ancora definiti. Andrà ripetuto quando profili ed effetti saranno decisi.

## Turno e segretezza

Fasi: `question` → (`roll` se la risposta è corretta) → movimento → arrivo → turno successivo. Un bivio attraversato sospende il movimento (`fork`, contesto `movement`) fino alla scelta, poi si consumano i passi residui. Il motore è l'unica autorità: `applyAction` non modifica lo stato ricevuto, rifiuta le azioni fuori fase (niente doppie risoluzioni) e il dado dipende solo dallo stato del suo flusso, non dalle animazioni.

`publicView` contiene soltanto celle esplorate, archi fra celle esplorate, l'indicazione che un percorso prosegue nella nebbia e, al bivio, lunghezza relativa e difficoltà delle alternative. Non contiene distanze, seed, impronta, configurazione né stato del dado. L'esplorazione è collettiva: ogni casella attraversata rivela le due successive, quindi le alternative di un bivio sono sempre visibili quando lo si raggiunge. Come previsto dalla specifica, non c'è protezione contro chi ispeziona il browser.

## Regole provvisorie da approvare

La specifica (§3, §10) lascia aperte queste decisioni. Le scelte seguenti servono solo a rendere il modello eseguibile e sono isolate nel motore e nella configurazione:

1. La difficoltà della domanda è quella della casella su cui inizia il turno. Chi inizia il turno su un bivio sceglie prima il ramo e riceve una domanda della difficoltà di quel ramo; se sbaglia resta sul bivio e al turno successivo può cambiare scelta. Chi attraversa un bivio durante l'avanzamento sceglie senza nuova domanda.
2. Risposta errata o tempo scaduto: nessun movimento.
3. Dado a sei facce; i passi oltre l'uscita si perdono; vince il primo che esce e la partita termina.
4. Caselle speciali di Megastrutture: «Terminale di Bafometto» ed «Evento industriale». Producono l'evento d'arrivo, ma senza effetti finché salute, crediti e Omen non saranno formalizzati.
5. Dimensioni della gara: 2–3 bivi, corridoi di 2–4 caselle, ramo lungo di 7–12, percorso più breve fra 16 e 36 passi, più lungo fino a 53 (su 1000 seed). Un giocatore solitario impiega in media 10–19 turni per uscire.
6. Da 1 a 6 giocatori (la simulazione usa il giocatore singolo; il prototipo almeno due).

## Non ancora realizzato

Nella fase 2: movimento animato delle pedine, CameraDirector con transizioni fra giocatori e verso Bafometto, taglio o trasparenza degli ostacoli, interfaccia provvisoria con domande fittizie, minimappa, caricamento per settori. Nelle fasi successive: kit modulare, direzione artistica, personaggi, Bafometto, timer della domanda e selezione delle domande dalle banche esistenti. Il motore riceve solo l'esito della risposta.
