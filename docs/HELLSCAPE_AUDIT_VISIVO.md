# Audit grafico Hellscape — primo intervento della specifica 1.2.0

Base ispezionata: `070df23`.
Ambito: qualità del logo e inventario del rendering. Le sezioni 12.5–12.7
della [specifica](HELLSCAPE_SPEC_CINEMATICHE_v1.2.0.md) precedono layout e
cinematiche. Questa PR non dichiara implementate le successive fasi.

## Riscontro principale e correzione

Il file `assets/hellscape-logo.webp` misura realmente **2172 × 724**, RGBA.
Il problema osservato non richiede di rigenerarlo: `assets/pixel-wordmark.js`
lo ricampionava in un Canvas **256 × 85** nella home e **68 × 23** nelle
intestazioni del gioco. Sostituiva poi `img.src` con quel bitmap, aggiungendo
`pixel-wordmark` e, nella home, `image-rendering: pixelated`.
Gli screenshot prima della correzione confermano che la classe era applicata.

A 1366 × 768 il wordmark della home occupava 720 × 239,06 pixel CSS:
ingrandimento orizzontale di **2,8125×**, oppure **5,625×** sui pixel fisici
a DPR 2. L’illustrazione dell’inseguimento restava invece alla risoluzione
originale. Il confronto mostra gradini e perdita dei dettagli sul metallo
del logo, accanto all'illustrazione più rifinita.

La correzione rimuove il ricampionamento distruttivo e il CSS associato.
Il logo originale resta identico, con metallo, biselli e luce già disegnati;
il browser lo riduce direttamente alle dimensioni d'uso. Il rapporto
intrinseco originale porta l'altezza della home a 240 pixel logici, eliminando
l'approssimazione del bitmap da 85 pixel. Nessun asset viene ricreato,
ingrandito artificialmente, rinominato o cancellato. La qualità del logo
nelle intestazioni di gioco viene ripristinata nello stesso intervento.
La pagina delle regole usava già l'originale e viene verificata per regressioni.

L'audit dei finali ha inoltre rilevato un difetto nell'export offline: i titoli
vittoria e Game Over venivano assegnati dinamicamente dalla UI e sfuggivano
all'inlining degli `src` statici. Ora la build li include nella mappa delle
risorse e la UI usa quegli stessi byte quando è offline. Il banco di revisione
verifica esplicitamente `naturalWidth > 0` per entrambi i titoli.

## Inventario e valutazione nel contesto

Le dimensioni seguenti sono misurate dai file e dal DOM, non solo dagli attributi
HTML. Le misure di utilizzo sono nel palco logico 1024 × 768, salvo indicazione
diversa. `tests/visual_quality.py` produce le misure CSS e fisiche effettive per
ogni viewport/DPR in `artifacts/quality/measurements.json`, insieme agli screenshot.
Per Canvas, la misura intrinseca è quella dell'atlante; la destinazione dei singoli
sprite deriva dalle funzioni elencate sotto, non dalla dimensione della pagina.

| Elemento / percorso o selector | Tipo e dimensioni intrinseche | Uso, campionamento e giudizio | Classe / priorità |
| --- | --- | --- | --- |
| Home `.home-illustration`, `hellscape-chase.webp` | RGB, 1448 × 1086, 2.36 MB | 826,67 × 620 logici, `contain`, campionamento auto, sfumatura ai bordi; illustrazione dettagliata, conservata | **OK** |
| Home `.home-wordmark`, `hellscape-logo.webp` | RGBA, 2172 × 724, 1.44 MB | 720 × 240 dopo la correzione, auto; niente pixelatura o sharpening; bordi e texture ora coerenti con la home | **Migliorare rendering / P1, corretto** |
| Header `.hellscape-logo`, stesso file | RGBA, 2172 × 724 | Box 170 × 39, `object-fit:contain`, nessun filtro; la superficie dipinta mantiene 3:1 all'interno del box | **Migliorare rendering / P1, corretto** |
| Titoli, menu, sottotitolo | Font `vt323-regular.ttf`, 153116 byte; sistema sans-serif per i testi lunghi | Font vettoriale, rasterizzato dal browser. Home: sottotitolo 28 px, comando principale 36 px, secondari 26 px nel palco; nessun filtro globale | **OK desktop; P2 layout mobile** |
| Pulsanti, pannelli, barra tempo, cuori, stemmi | CSS/DOM, geometria vettoriale | Bordi, gradienti, testo e ombre restano separati dal Canvas; il blur di 2 px è sullo sfondo del pannello domanda, non sul testo | **OK desktop; P2 layout mobile** |
| Ammo inventario `ammo-hellscape-v2.png` | Palette con alpha, 336 × 48 (7 icone da 48 × 48), 4768 byte | 48 × 48 nei controlli, 88 × 88 nel dettaglio; nearest-neighbor intenzionale per pixel art; sagome/materiali distinti | **OK**, griglia intenzionale |
| Effetti Ammo `hell-race/ammo-relics-v1.webp` | RGBA, 1330 × 1182 | Porzioni ritagliate dall'atlante e composte nel Canvas; nearest-neighbor della pipeline di scena | **OK**, verifiche già in `test:ammo` |
| Selezione mezzi `.vehicle-preview canvas` | Canvas 160 × 90; atlante `vehicles-drive-v1.webp` RGBA 1254 × 1254 | Riduzione degli sprite con proporzioni conservate, nearest-neighbor; preview più piccola del box, nessun nuovo upscale | **OK** per silhouette; confrontare leggibilità mobile nella PR layout |
| Veicoli della corsa, stesso atlante | 48 pose, 6 mezzi × 8; alpha | Larghezze logiche 27,28 / 35,96 / 38,44 / 33,48 / 34,72 / 24,8; altezza derivata dall'aspect ratio del frame normalizzato. Canvas 512 × 384 → palco 1024 × 768 | **Migliorare rendering / P2**: dettaglio inferiore al fondale illustrato; valutare campionamento prima di ricreare sprite |
| Demone corsa `demon-actions-v1.webp` | RGBA, 1536 × 1024, 12 pose | Destinazione nominale 170 × 125 prima della trasformazione di scena 1,3×; nearest-neighbor. Parte della sagoma esce a sinistra nell'inquadratura corrente | **Migliorare rendering / PR A**: framing e locomozione, non una mancanza di pixel del file |
| Demone finale `demon-ending-v1.webp` | RGBA, 1536 × 1024, 16 pose normalizzate | Render con ancoraggi mano/bocca; larghezza nominale 260, alpha e ritagli verificati dai test dei frame | **OK asset**, coreografia da PR C/D |
| Panorama `infernal-world-v1.webp` | RGB, 1536 × 1024 | Campioni del fondale nel Canvas, riduzione e ripetizione; visivamente molto dettagliato rispetto ai veicoli | **OK asset**; confronto campionamento nella PR layout |
| Ponte `lava-bridge-v1.webp` | RGBA, 2172 × 724 | Tre fasce distinte: parapetto lontano, strada (110 pixel logici), muratura; tile largo 768. La qualità è buona ma le unità mondo/renderer non sono ancora centralizzate | **Migliorare rendering / P2** e geometria PR D |
| Lava `lava-lake-v1.webp` | RGB, 1536 × 1024 | Tessitura sotto il ponte, correnti CSS/Canvas e scintille limitate; nessun nuovo filtro | **OK** |
| Terreno/detriti/geyser `hell-terrain.js`, `hell-bridge.js` | Disegno procedurale Canvas | Fessure, ossa, rottami e particelle con griglia intenzionale; nessuna texture sfocata da sostituire | **OK**, disegno dipendente dalla pipeline |
| Portale `portal-flames-v1.webp` | RGBA, 2172 × 724, 8 fotogrammi | Ridotto entro 85 × 190 prima dello scaling del palco; portale frontale arancio, attualmente ancorato allo schermo | **Ricreare asset / PR D**: la specifica richiede architettura neoclassica bianco/azzurro/oro e prospettiva condivisa; aumentare i pixel non risolve |
| Domanda e soluzione `.operation-body` | DOM, font sistema e KaTeX incorporato | Testo indipendente dalla scena, dimensioni 19/17/16 px logiche; attualmente l'intero palco viene scalato anche su telefono | **Migliorare rendering / P2 layout**: servono reflow e controlli leggibili |
| Primo turno spareggio | DOM + scena ordinaria | Tre cuori singoli, timer fermo, nessuna intro dedicata attualmente presente | **Migliorare rendering / PR B**, non attribuire alla presente PR l'intro prevista |
| Titolo vittoria `.end-wordmark`, `wins-yellow.png` | RGBA, 2046 × 768, 2.01 MB | Altezza massima 110 px logici, trasparenza; illustrazione nitida, testo corrente **WINS**, non ancora VITTORIA | **OK qualità asset; PR D** per testo/regia richiesti |
| Game Over `.end-wordmark`, `game-over.png` | RGBA, 1254 × 1254, 1.54 MB | `contain`, nessun ricampionamento distruttivo; titolo dopo la danza corrente | **OK qualità asset** |
| `devilFrame()` e fallback della corsa | Canvas procedurale e bitmap inline | Diavoli in volo e sagome di ripiego in assenza di asset, deliberatamente pixel art | **OK fallback**, non usati come sostituto degli asset caricati |

I file storici `fool-logo.png`, `wins.png`, `ammo-hellscape-v1.png`,
`ammo-sprites-48.png`, `ammo-ira-divina.webp`, `eliminated-x.png`,
`hell-race/vehicles.webp` e `hell-race/demon.webp` sono inventariati nei dati
grezzi. Non vengono rimossi: non sono la causa del difetto corretto e la
specifica chiede di preservare gli originali durante il confronto.

### Mobile, DPR e limiti dell'audit

Su 390 × 844 il palco corrente è largo 390 e alto 292,5 pixel CSS, scala
0,380859375. Il logo occupa **274,22 × 91,41** pixel CSS, con una sorgente
2172 × 724 anche a DPR 2. La definizione del logo è quindi sufficiente;
il menu secondario a 26 pixel logici diventa però circa **9,9 pixel CSS** e
il suo controllo da 42 pixel alto diventa **16 pixel CSS**. Aumentare la
risoluzione dell'immagine non corregge questa leggibilità: il reflow dei
pannelli e delle azioni è la prossima PR preliminare della sezione 12.

Il Canvas 512 × 384 resta deliberatamente invariato: ingrandirne soltanto il
buffer non ricostruisce il dettaglio perso dagli sprite. La proposta di un
buffer DPR deve essere accompagnata da confronto visuale e prestazioni nel
contesto del layout, senza cambiare la griglia degli asset illustrati.
La classificazione artistica resta soggetta a revisione dell'utente; DPR e
viewport emulati non certificano le prestazioni di un telefono fisico Android.

## Mappa dei punti d'integrazione verificati

| Modulo | Funzioni effettive e responsabilità |
| --- | --- |
| `assets/hell-race.js` | `atlasRow`/`frameRect`: ritaglio e normalizzazione; `vehicleSize`/`drawVehicle`/`vehiclePreview`: proporzioni; `packPosition`: punti → posizione; `background`/`scene`: composizione; `syncVisual`: consumati e coda catture; `createStage`: Canvas, clock e dispatch `foolanimationchange`/`foolendingcomplete`; `demon`: posa; `gate`: sprite del portale |
| `assets/hell-ending.js` | `plan`/`sample`: piano e fasi; `prepare`/`actor`: pose e ancoraggi; `capture`: cattura; `portalMotion`/`drawPortal`: emersione e discesa; `rageMotion`/`render`: epilogo. `drawPortal` usa ancora posizione fissa e clip rettangolare |
| `assets/hell-bridge.js` | `TOP`, `BOTTOM`, `RACE_SCALE`, `grounds`: strada e posizioni; `draw`: lago, fasce del ponte e deterioramento; velocità della texture 48 pixel/s |
| `assets/js/engine.js` | `finishCheck`: completa tutto il giro di spareggio e rileva la parità solo dopo il numero di domande previsto; `eliminate`, `complete`, `next`, `reveal`, `answer`: autorità della partita; nessuna modifica in questa PR |
| `assets/js/ui.js` | `syncCinematic`/`gameStage`: pausa e osservazione eventi; `animateOutcome`: esito; `endScreen`: titolo dopo la cutscene; `renderGame`: UI; IIFE `fit`: scaling dell'intero palco, incluso il testo; `HellscapeUI`: facciata usata dal banco di revisione |

La locomozione oggi usa `Math.floor(tick*9)%4`, non la distanza sul ponte;
`roadPhase` non avanza durante il finale. Questi sono gli interventi della PR A/C,
da trattare insieme alla regia, senza cambiare il motore nella correzione del logo.

## Riproduzione e consegna

`npm run test:quality` genera `dist/Hellscape-review.html`, un solo file offline
con un pannello **Scenari di revisione**. I comandi aprono home, selezione,
domanda/Ammo, ultimo esito ordinario, primo turno spareggio, portale attuale,
vittoria attuale, Game Over e regole. Il pannello è uno strumento di revisione
incorporato soltanto in questo export: non compare sul sito o nell'export normale.
Spareggio e vittoria usano il motore reale; il campione del portale forza soltanto
il timestamp passato al renderer. Le scritture restano nelle chiavi offline già
isolate da quelle del sito. Gli scenari sostituiscono la partita dell'anteprima.

Il test acquisisce dieci scenari per ogni combinazione di 1920 × 1080,
1366 × 768, 1024 × 768, 844 × 390, 390 × 844 e DPR 1/2, con movimento ridotto;
verifica anche cambio orientamento e fullscreen. Il portale è campionato a
`captureEnd + 0,6 s`, già emerso nella timeline corrente. Non è un'attestazione
della nuova prospettiva o della nuova coreografia, ancora da implementare.
L'intro spareggio non esiste ancora: lo screenshot documenta il primo turno.

`npm run preview:offline` genera il gioco normale `dist/Hellscape-offline.html`.
Il workflow della PR conserva entrambi gli HTML, revisione e screenshot nel suo
artefatto scaricabile. Gli output `dist/` non sono modificati manualmente.

L'HTML autonomo è circa 31 MiB: incorporare i due titoli prima mancanti aggiunge
circa 4,5 MiB all'export, senza aumentare i file del sito. Nei browser gestiti che
bloccano `file://`, il test trasferisce quei byte via CDP; il timeout di navigazione
è 120 secondi per consentire il trasferimento anche sui worker con CPU limitata.
Il banco di revisione riutilizza la pagina di gioco tra scenari successivi,
ferma il timer precedente e ripristina il renderer dopo il campione del portale.

I test del motore/persistenza, frame, browser, finali e offline sono eseguiti
separatamente; i risultati conclusivi e gli eventuali limiti sono riportati
nella PR. Nessuna modifica a regole, punteggi, Ammo, turni o formato dei salvataggi.
Nessun merge o pubblicazione prima della revisione e approvazione dell'utente.
