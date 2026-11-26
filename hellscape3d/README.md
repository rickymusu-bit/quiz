# Hellscape 3D — modello logico (fase 1)

Prima fase del redesign descritto in [Città procedurali 3D e regia di gioco](../docs/HELLSCAPE_PROCEDURAL_3D_CITIES.md), §9: modello logico e test, senza rendering. Il runtime pubblicato (`index.html`, `assets/`) non usa questo codice e non viene modificato; nemmeno i salvataggi `fool-v1` e `fool-settings-v1`.

Il codice è TypeScript con sola sintassi cancellabile, eseguito direttamente da Node (≥ 22.18) senza compilazione. `typescript` e `@types/node` servono soltanto al controllo dei tipi. Three.js e Vite non sono ancora introdotti: arriveranno con il graybox della fase 2.

```sh
npm run test:hellscape3d   # controllo dei tipi e test del modello logico
npm test                   # suite core completa, che li comprende
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

## Non compreso in questa fase

Layout spaziale 3D, kit modulare, CityBuilder, CameraDirector, personaggi, Bafometto, minimappa grafica, timer della domanda e selezione delle domande dalle banche esistenti. Il motore riceve solo l'esito della risposta.

Prossima fase suggerita dalla specifica: graybox 3D modulare con camera (Three.js e Vite), costruito sopra questo modello.
