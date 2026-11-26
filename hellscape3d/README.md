# Hellscape 3D

Redesign descritto in [Città procedurali 3D e regia di gioco](../docs/HELLSCAPE_PROCEDURAL_3D_CITIES.md). Il runtime pubblicato (`index.html`, `assets/`) non usa questo codice e non viene modificato; nemmeno i salvataggi `fool-v1` e `fool-settings-v1`. La pagina di prova della fase 2 non è pubblicata.

Stato (§9 della specifica):
- **fase 1, modello logico e test:** completata;
- **fase 2, graybox 3D modulare con camera:** in corso. Consegnati: layout spaziale, volumi graybox e nebbia di guerra nella scena (primo passo); pedine animate e CameraDirector (secondo passo); interfaccia provvisoria con domande fittizie e minimappa (terzo passo); ostacoli davanti alla camera e inquadratura sopra il pannello (quarto passo); scena provvisoria di Bafometto (quinto passo). Manca la ripresa della partita salvata nella pagina, richiesta dalla vertical slice (§9).

Il codice è TypeScript con sola sintassi cancellabile. Il modello logico e il layout girano direttamente in Node (≥ 22.18) senza compilazione; la pagina di prova usa Vite e Three.js.

```sh
npm run test:hellscape3d           # controllo dei tipi e test Node (logica, layout, scena)
npm run test:hellscape3d:browser   # build Vite e verifica in Chromium, desktop e mobile orizzontale
npm run dev:hellscape3d            # pagina di prova su http://127.0.0.1:5173
npm run record:hellscape3d -- --seed graybox-1 --steps 3 --actions 14   # GIF reale in artifacts/hellscape3d/ (richiede ffmpeg)
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

**Pagina di prova.** Parametri: `?seed=…`, `?steps=N` (azioni automatiche iniziali), `?view=overview` (panoramica delle zone esplorate) e `?reveal=all`, che mostra l'intera città **solo per lo sviluppo**, per giudicare il layout. Tasti: 1–4 risposte e alternative, Invio lancia il dado, Spazio o S saltano la regia, F accelera ×3, V cambia inquadratura, A esegue un'azione automatica (sviluppo). `?motion=reduced` attiva il movimento ridotto, `?timer=S` cambia la durata della domanda, `?test=1` espone ai test la risposta corretta. Le azioni automatiche simulano le risposte con il profilo provvisorio.

## Pedine animate e regia (fase 2, secondo passo)

`director/director.ts` contiene il CameraDirector, puro e indipendente da Three.js. Riceve gli eventi prodotti dal motore e li trasforma in clip di presentazione. Lo stato è già deciso quando le clip vengono accodate: accelerare (F, ×3) o saltare la regia (S, oppure Spazio mentre è in corso) cambia solo ciò che si vede. A regia conclusa pedine, celle mostrate e giocatore attivo coincidono sempre con lo stato.

| Evento del motore | Presentazione |
| --- | --- |
| inizio turno di un altro giocatore | transizione verso la sua pedina (vedi sotto) |
| domanda | avvicinamento al personaggio, 0,6 s |
| dado | inquadratura di inseguimento, 0,4 s |
| avanzamento | camminata lungo le passerelle, 0,32 s per casella, con la camera che segue |
| bivio | inquadratura del bivio e delle sole alternative locali, 0,7 s |
| arrivo su casella speciale | breve pausa, 0,5 s |
| fine partita | inquadratura della porta d'uscita, 1,2 s |

Le transizioni fra giocatori dipendono dalla distanza calcolata sulla sola rete già mostrata. Fino a 4 passi è una traslazione (0,7 s). Fino a 12 passi nello stesso distretto la camera si allontana, trasla e si riavvicina (1,25 s). Negli altri casi, compresi i giocatori non collegati da zone esplorate, c'è una dissolvenza a nero: la camera cambia posizione solo a schermo oscurato (0,8 s), senza sorvolare la città. I tempi stanno negli intervalli indicativi della specifica e restano obiettivi di prototipazione.

Durante la camminata le celle compaiono quando la pedina le raggiunge con lo sguardo, nello stesso ordine del motore, e non al momento del lancio. Con `?motion=reduced`, o con la preferenza di sistema per il movimento ridotto, la regia è istantanea. La direzione di vista resta sempre la stessa: la camera cambia distanza e inclinazione, mai orientamento.

## Interfaccia provvisoria e minimappa (fase 2, terzo passo)

`ui/` contiene un'interfaccia HTML/CSS sopra la scena, provvisoria. I pannelli compaiono solo a regia ferma, quindi mostrano sempre la presentazione e non lo stato anticipato del motore. Sono pulsanti reali, raggiungibili da tastiera, con il primo elemento già selezionato.

- **Turno:** numero del turno, giocatore attivo secondo la presentazione e elenco dei giocatori con i colori delle pedine.
- **Domanda fittizia** (`ui/questions.ts`): un calcolo aritmetico, dichiarato fittizio, scelto in modo deterministico per partita, turno e giocatore. Facile: somma; media: prodotto; difficile: prodotto meno un numero. Quattro opzioni distinte, risposta con clic o tasti 1–4. Il collegamento alle banche di domande reali è un passo separato.
- **Timer** (`ui/timer.ts`): 30 secondi, valore provvisorio. Scorre solo con la domanda visibile, a regia ferma e con la pagina in primo piano; alla scadenza la risposta vale come tempo scaduto. La domanda viene creata solo quando diventa visibile, quindi la regia non può consumarne il tempo.
- **Dado:** pulsante (o Invio) dopo la risposta corretta; il risultato resta visibile durante la camminata.
- **Bivio:** alternative ordinate dalla più breve alla più lunga, con lunghezza relativa e difficoltà (tasti 1–3). Gli stessi numeri compaiono nella scena sugli imbocchi dei rami, con il colore della difficoltà.
- **Fine partita:** nome di chi è uscito e pulsante per una nuova città.
- **Minimappa** (`ui/minimap.ts`): vista dall'alto delle sole celle mostrate, dei tratti verso la nebbia e dei giocatori, con il giocatore attivo evidenziato. È orientata come la camera (in alto ciò che sta davanti alla vista) e si adatta alle sole zone esplorate, quindi non suggerisce l'estensione della città.

Su schermi bassi (mobile orizzontale) pannelli e minimappa si riducono. Il tasto A esegue un'azione automatica, solo per lo sviluppo.

## Ostacoli davanti alla camera (fase 2, quarto passo)

`scene/occlusion.ts` individua i volumi disegnati (caselle, piloni, passerelle, masse) attraversati dal segmento fra la camera e la pedina attiva, ai piedi o alla testa. Il renderer li sposta in istanze con materiale semitrasparente (opacità 0,18) e ricostruisce questa parte della scena solo quando l'insieme degli ostacoli cambia. Poiché si disegnano solo zone già mostrate, guardare attraverso un ostacolo non rivela nulla di inesplorato. Dimensioni dei volumi e posizione della camera stanno in `scene/dimensions.ts`, condiviso da renderer e calcolo.

Su 20 città, in oltre 14 000 fotogrammi di partita simulata, la pedina attiva risulta coperta nell'1,5% dei casi, sempre da elementi del percorso e mai da masse edilizie: la regola che le tiene basse dal lato della camera funziona. Il caso tipico è la passerella sopraelevata del ramo breve che passa davanti a una pedina sul ramo laterale più basso.

Quando un pannello occupa la parte bassa dello schermo, l'inquadratura si decentra (`setViewOffset`) in modo che il punto inquadrato resti al centro dell'area libera, senza spostare la camera né deformare l'immagine. Il passaggio è graduale, istantaneo con il movimento ridotto. `?occlusion=off` disattiva le trasparenze, solo per confronto.

## Bafometto provvisorio (fase 2, quinto passo)

`director/bafometto.ts` e il regista danno a Bafometto una presenza provvisoria, secondo la specifica (§6):

- **Sede:** una macchina monumentale in graybox su un pilone che sale dall'abisso, con occhi verdi che si accendono quando parla. Sta a distanza fissa dalla partenza (−46, −4, +8), dal lato −X dove il percorso non va mai. La posizione dipende solo dalla partenza, quindi non rivela uscita né topologia. Un test verifica su 80 città che resti lontana da percorso e masse.
- **Interventi significativi** (apertura di una partita nuova, fine partita): dissolvenza, inquadratura della sede, battuta, dissolvenza e ritorno al giocatore o all'uscita. Nessun tragitto della camera fra sede e giocatore e nessuna cella rivelata.
- **Scambi frequenti** (arrivo su una casella «Terminale di Bafometto»): manifestazione locale, senza passare dalla sede. Il terminale si illumina, la camera si avvicina e compare la battuta.
- **Battute:** testi segnaposto in un riquadro dichiarato «testo provvisorio», mostrati per 3,5 s anche con il movimento ridotto, che invece rende istantanee le inquadrature. Gli effetti di Bafometto sul gioco (Omen, crediti, salute) non sono ancora definiti dal regolamento.

`?intro=off` disattiva l'apertura.

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

Nella fase 2: ripresa della partita salvata nella pagina di prova, caricamento per settori. Nelle fasi successive: kit modulare, direzione artistica, personaggi, Bafometto, durata definitiva del timer e selezione delle domande dalle banche esistenti. Il motore riceve solo l'esito della risposta.
