> **NUOVA DIREZIONE DI PROGETTO (31/10/2026):** [Bafometto biomeccanico — specifica v1.0.0](../../docs/HELLSCAPE_BAFOMETTO_DIREZIONE_CINEMATICA_v1.0.0_20261031.md). Il nuovo boss levita a gambe incrociate, può avere due artefatti metallici **integrati nelle mani** (forme ancora non definitive), solleva il perdente e lo incenerisce con **fuoco verde sulfureo fino alla cenere**. Gli ambienti cambiano con la progressione delle domande fino a una **porta d'uscita già nello scenario**. Le descrizioni di Cerbero/ponte/portale qui sotto si riferiscono agli **asset e al runtime pre-redesign**, da conservare finché la sostituzione non è prodotta e approvata; **non** sono più la direzione artistica corrente.

> Runtime corrente: [Cerbero v2](../../docs/cerbero-v2/README.md), otto pose canine disegnate, teste e coda articolate, presa con la bocca e lancio nella lava. I veicoli usano una sagoma rigida, con piccole oscillazioni delle sospensioni. I precedenti rig e le prese con mani descritti sotto sono storici.

> Aggiornamento 29/10/2026: il runtime usa ora il [Cerbero carne approvato](../../docs/cerbero/README.md) e la fiala `arsenico-v1.png`. Le sezioni sugli atlanti bipedi qui sotto sono storiche; questi file non vengono più caricati dal gioco o dall’export offline.

# Asset della corsa infernale

Versione grafica **1.8.0** — 28/10/2026.

Direzione corrente: ponte nero approvato e veicoli al doppio della prima GIF; lava e struttura condividono la camera. Il portale `portal-side-v3.png` è disegnato nativamente di taglio, in marmo bianco, azzurro e oro, con stipiti, tetto e fiancata già presenti nei pixel. Il renderer lo posiziona con sola traslazione e scala uniforme; non deforma una facciata frontale. Discesa, impatto, passaggio e crollo mantengono la timeline approvata. Le macerie restano nel mondo. Le sezioni delle versioni precedenti sotto sono storiche e non prevalgono su [v1.3.0](../../docs/HELLSCAPE_CORREZIONI_CODEX_v1.3.0.md) e sulle correzioni approvate dall’utente.

Pixel art infernale dal riferimento approvato: ferro annerito, ruggine, cuoio, emblemi distintivi e luce di lava. Asset raster generati con lo strumento integrato imagegen, convertiti in WebP mantenendo il canale alfa. Specifiche in [PROMPTS-v1.md](PROMPTS-v1.md).

| File | Fotogrammi | Uso |
| --- | --- | --- |
| `vehicles-drive-v1.webp` | 8 per mezzo, 6 righe | Chopper con pilota, pick-up, camion, coupé, fuoristrada, Ape |
| `demon-actions-v1.webp` | 4 per azione, 3 righe | Corsa, attacco, morso |
| `portal-flames-v1.webp` | 8 | Portale precedente, conservato e non più caricato |
| `portal-side-v3.png` | Vista nativa di taglio 1024 × 1536, RGBA | Portale volumetrico in marmo bianco, azzurro e oro; angolo e spessore disegnati nello sprite |
| `portal-rocks-v1.png` | 6 rocce, atlante 1536 × 1024, RGBA | Frammenti di marmo grigio/bianco, superfici di frattura e volume nativo; usati durante caduta e riposo |
| `black-stone-bridge-v1.png` | 2172 × 724, RGBA | Ponte approvato, pietra e metallo neri, archi trasparenti |
| `lava-sea-v2.png` | 1448 × 1086, RGB | Lava sotto il ponte, nello stesso riferimento della struttura |
| `antisigillo-icon-v1.png` | 1254 × 1254, RGBA | Reliquia in ferro nero e osso: cuneo biforcuto che spezza il collare protettivo; inventario e scheda Ammo |
| `antisigillo-tool-v1.png` | 1254 × 1254, RGBA | Cuneo isolato per volo, contatto e frattura; sprite rigido con scala uniforme |
| `victory-title-v1.webp` | 1981 × 793, RGBA | Titolo VITTORIA, trasparente |
| `infernal-world-v1.webp` | Panorama | Fortezze, strada e lava con velocità di scorrimento diverse |

`assets/hell-race.js` contiene le bande di origine effettive degli atlanti: le righe della tavola veicoli hanno spaziatura irregolare. Il renderer separa le sagome connesse e normalizza gli otto fotogrammi della stessa riga su tele trasparenti con scala comune. La stessa separazione viene applicata ai 12 fotogrammi del demone, con bande reali che includono corna, muso e mandibola. Questo evita tagli e frammenti delle celle vicine; le pose troncate sul bordo destro della sorgente sono sostituite da una posa completa. La strada ha un velo carbone, mentre lava e cielo mantengono i colori originali. I veicoli attivi partono davanti al demone; in caso di cattura la creatura viene disegnata in primo piano. Le anteprime e i riquadri dei giocatori usano gli stessi sprite della corsa.

Le eliminazioni e i finali sono coordinati da `assets/hell-ending.js`. Il portale appare soltanto quando resta da far fuggire il vincitore; non viene anticipato durante la partita ordinaria. Polvere e braci completano il movimento. Pausa e sospensione fermano la scena; la preferenza di sistema per il movimento ridotto mostra pose ferme. La grafica non modifica punteggi, turni o salvataggi.

I due asset statici `vehicles.webp` e `demon.webp` della v1.1.0 sono conservati come versione precedente, ma non vengono caricati dalla nuova scena.

I veicoli formano un gruppo compatto: i tre appoggi verticali occupano 68 pixel logici e lo scarto orizzontale dovuto al punteggio è compresso. I nomi non vengono disegnati sul Canvas. Il mezzo del rispondente viene dipinto per ultimo con un contorno giallo ricavato dall’alfa di ciascun fotogramma; i dati di tutti i giocatori sono mostrati soltanto nel riquadro dei turni, senza finestre accanto ai mezzi. Turnazione e finestre Inventario/Opzioni sono gestite da `assets/js/ui.js`.

Le larghezze logiche sono: camion 62, pick-up 58, fuoristrada 56, coupé 54, chopper 44, Ape 40. Ogni mezzo conserva le proporzioni della propria sagoma; le anteprime usano un fattore comune. `tests/vehicle_layout.cjs` controlla dimensioni, integrità dei fotogrammi, compattezza e contorno; i test browser verificano le finestre, l’ordine di turno e il timer in tre dimensioni di schermo.

Le ruote sollevano scie di polvere a lobi pixel art, che si espandono, scorrono all’indietro e sfumano; sassolini seguono piccole traiettorie balistiche. L’intensità dipende dal mezzo. I passi alternati del demone, sincronizzati ai quattro fotogrammi di corsa, generano nuvole più pesanti e zolle di terra; attacco e morso hanno impatti localizzati. Gli effetti dipendono soltanto dall’orologio della scena: nessun uso del generatore casuale del gioco, nessuna coda di particelle o timer aggiuntivo. Pausa e movimento ridotto congelano anche polvere e detriti. `tests/hell_dust.cjs` verifica evoluzione, dissolvenza, determinismo, limite delle particelle e isolamento dello stato Canvas.

## Presa, veicolo inghiottito e fiammata — v1.3.0

`demon-ending-v1.webp` aggiunge sedici pose, generate dal demone già approvato: presa con una mano, sollevamento, bocca aperta, masticazione, ruggito e danza. L’originale di generazione è conservato nell’ambiente di lavoro; il WebP è una conversione senza perdita. Come per la corsa, il runtime separa le sagome complete e le normalizza su tele trasparenti senza tagliare mani, corna o piedi. I punti della mano e della bocca collegano il veicolo all’azione.

Il demone afferra l’intero veicolo, lo solleva con una mano e lo porta alle fauci: il mezzo viene inghiottito, segue la masticazione e poi una fiammata verso l’alto. Non rimane un veicolo abbandonato sulla strada. Le fiamme e le scintille sono particelle pixel art sincronizzate alla bocca. La memoria visuale della sessione registra le catture completate, senza scrivere nello stato o nei salvataggi del motore, così un eliminato non ricompare nel finale.

Con un vincitore e nessun avversario ancora da rimuovere, il portale sale dal terreno e lascia passare soltanto il superstite. Dopo il passaggio inizia a sprofondare: il demone ruggisce e lo investe con una fiammata mentre scende. Quando il portale è completamente sparito il demone compie tre salti sul posto con colpi dei pugni sul terreno. Se la partita termina per punteggio con altri giocatori attivi, le loro catture e le successive fiammate precedono l’apertura del portale. Senza vincitore viene inghiottito l’ultimo veicolo rimasto, seguita dalla fiammata e dalla danza di vittoria del demone. Le schermate WINS/GAME OVER e i relativi controlli compaiono al termine della sequenza, per non coprire l’azione. Con movimento ridotto si passa direttamente al quadro conclusivo.

`npm run test:endings` verifica le sequenze reali in Chromium, l’assenza di resurrezioni, la continuità dopo un ridisegno UI, pausa, scheda nascosta e movimento ridotto. `python3 tests/endings.py --gifs` genera le GIF in `artifacts/`.

## Terreno continuo e progressivo — v1.4.0

`assets/hell-terrain.js` sostituisce la fascia con separazioni orizzontali con un piano unico di lastre di basalto, texture irregolari ricavate dallo stesso scenario e graniglia. I tasselli statici sono memorizzati in una cache limitata a 24 elementi; il resto è calcolato da seme e orologio della scena, senza RNG della partita.

Il livello è il rapporto tra domande completate e domande impostate. Crescono ampiezza delle crepe, buche, lava visibile, fiamme, ossa, teschi umani, teschi demoniaci con corna e zanne, e rottami metallici riconoscibili come ruote/assi, portiere, cofani e paraurti. Alcune bocche vulcaniche eruttano getti di lava con ricaduta delle gocce, alternando eruzione e quiete. Le decorazioni scorrono sullo stesso piano, dietro gli attori. Pausa e movimento ridotto rispettano l’orologio della scena; il livello è ricostruibile da qualsiasi salvataggio. Una vittoria anticipata non porta artificialmente il terreno al massimo.

Le etichette dei giocatori sono assenti durante tutte le animazioni di cattura e fuga, compreso il superstite in attesa. Durante la corsa i nomi, punti e vite sono nel riquadro dei turni; il nome del vincitore appare nell’interfaccia dell’esito dopo la cinematica.

`npm run test:terrain` verifica inizio/metà/fine su desktop e Android senza alterare il motore; `python3 tests/terrain_browser.py --gifs` produce il confronto `artifacts/terrain-stages.png` e la GIF `artifacts/terrain-evolution.gif`. I test senza browser controllano progressione, determinismo, limiti di disegno ed eruzioni; i test dei finali impediscono regressioni nelle etichette.

Le fiammate usano un getto continuo simile a un lanciafiamme, con nucleo chiaro, cono turbolento e gocce incandescenti. Dopo un inghiottimento il getto sale verso l’alto; dopo la fuga segue il portale mentre si interra. La timeline ammette una sola attraversata e separa emersione, fuga, ruggito, attacco e rabbia.

Nel finale il suolo resta fermo mentre fiamme e geyser continuano a muoversi con lo stesso orologio della sequenza; pausa e movimento ridotto congelano entrambi.

Otto piccoli diavoli alati in silhouette volano nella fascia alta del cielo. Le sagome sono tracciate sul Canvas, larghe al massimo circa 14 pixel logici: oscillano e battono le ali lentamente, senza particelle accumulate o uso del caso del gioco. L’orologio comune congela anche il loro movimento in pausa, a scheda nascosta e con movimento ridotto. Restano dietro la scena principale e i pannelli.

La figura espone `data-animation-busy` ed emette `foolanimationchange` durante avanzamenti, catture e finale. Il renderer non modifica lo stato di gioco; l’interfaccia usa questi segnali per nascondere i pannelli e, quando serve, conservare il tempo di risposta. La pausa temporanea dell’orologio per l’animazione lascia proseguire il Canvas; la pausa manuale e la sospensione lo congelano. Una cattura conclusa passa al prossimo attore o alla corsa nello stesso fotogramma.

## Revisione horror e ponte sospeso

- `ammo-relics-v1.webp`: atlante 3×3 di catena, ossario, basalto infuocato, gabbia gotica, occhio demoniaco, specchio infranto, tributo, bilancia e fiammata. Animazione per assemblaggio, chiusura, apertura, rotazione, eruzione e frammenti; nessun alone geometrico al neon.
- `lava-bridge-v1.webp`: superficie carrabile di basalto e ferro, parapetto gotico e muratura sospesa con catene. Tre bande sorgente condividono lo scorrimento.
- `lava-lake-v1.webp`: superficie liquida del lago di lava, separata dal ponte.

Asset generati con imagegen, convertiti in WebP qualità 90 con alfa. Gli originali PNG sono conservati in `/workspace/generated_images/` (exec-648ff1a1-cff7-44ac-9861-1b218517231d, exec-8458c4de-83f5-4838-ba21-499b21c05aa1, exec-3984dcd7-ca3a-4290-844a-160cf1b41f67). La scala di corsa 0,62 e gli appoggi calcolati dalle sagome sostituiscono i vecchi appoggi fissi; corsa e cattura conservano tutte le pose complete.


## Portale neoclassico e VITTORIA — v1.6.0 / PR D

I due nuovi asset sono generati con imagegen. I master PNG, conservati senza
modifiche in `/workspace/generated_images/`, sono rispettivamente
`exec-c3ec3a2a-21ab-44ee-ae6f-7c8fd5235475.png` e
`exec-f9f02cd2-ac1b-43ce-9d9d-e36fdd81b7f6.png`. La conversione WebP è lossless
con conservazione esatta dei pixel RGBA; non si applicano resize o sharpening.

La facciata è un'elevazione ortografica di colonne corinzie, cornici, frontone
scolpito e basamenti in marmo avorio/oro, con apertura realmente trasparente.
Il renderer aggiunge luce bianca/azzurra, spessore e immersione tramite la
stessa proiezione del ponte, invece di sovrapporla frontalmente allo schermo.
Il titolo VITTORIA mantiene dettaglio illustrato e trasparenza; la UI ritaglia
soltanto il letterbox trasparente e affianca il sottotitolo nativo con il nome
reale, leggibile anche su telefono. I precedenti `portal-flames-v1.webp` e
`assets/wins-yellow.png` sono preservati, ma esclusi dal caricamento corrente.

La regia attuale sostituisce il precedente epilogo: attraversamento completo,
sprofondamento, pugni piantati, una fiammata, affanno e titolo. Le sezioni
v1.3–1.5 sopra documentano le versioni precedenti. Geometria e verifiche sono
in [HELLSCAPE_PORTAL.md](../../docs/HELLSCAPE_PORTAL.md).

## Antisigillo — v1.8.0

Icona e utensile sono due PNG nativi generati con imagegen, conservati senza
ridimensionamento né ritocchi. I master sono `exec-108b1a85-f9e8-475c-a8fd-132676b4e4ef.png`
e `exec-d30732e4-bade-497a-b688-1e67fc57368c.png`. Ferro annerito, ruggine,
osso e piccole fenditure verde spento riprendono le altre reliquie.

Il cuneo raggiunge il Sigillo sul veicolo bersaglio, entra nella protezione
e separa due metà frastagliate di osso e ferro. Frammenti, rotazione, caduta e
scomparsa completano la sequenza di 2,6 secondi. Le fasi dipendono solo
dall’orologio della scena; pausa e movimento ridotto restano rispettati.
Il renderer non modifica stato, punteggi, vite o inventari. Le regole esistenti
restano invariate: un solo avversario protetto, una copia consumata, rimozione
del Sigillo senza danni né Contrappasso. Entrambi i PNG sono incorporati
anche nelle versioni offline. Il vecchio SVG non referenziato è rimosso.

## Sacrificio — regole 22.0.0

`sacrificio-v1.png` è un PNG RGBA nativo, generato con imagegen e copiato senza
ritocchi da `exec-403cb37b-4f72-4d25-ae2f-159ce7fbea77.png`: calice di ferro,
oro antico, osso e cuore cremisi. È usato in inventario, scheda e cinematica,
e incorporato nell’export offline. La sequenza mostra il calice sopra chi lo
usa e il costo/ricavo −1 vita, +777 punti. Tributo mostra il trasferimento e
il costo del turno corrente; le animazioni non modificano lo stato del motore.

## Contrappasso — regole 25.0.0

Lo specchio gotico dell’atlante nativo ora si innalza sul giocatore che attiva
Contrappasso, con indicazioni di punti ×2 e rischio −2×. Non proietta più un
attacco verso l’aggressore. Nessuna modifica ai pixel dell’atlante; l’effetto
continua a rispettare pausa, movimento ridotto e orologio della scena.

## Diavoli volanti approvati — 30/10/2026

- `diavolo-flight-aba-v1.gif`: GIF A→B→A approvata dall'utente in conversazione («Perfetto. Salvalo negli asset sul repo»), conservata senza modifiche.
- `diavolo-flight-v1.webp`: atlas lossless di otto celle 420×560, estratte dai primi otto frame della GIF; nessun ridisegno, morphing o deformazione locale.
- `diavolo-flight-v1.json`: dimensioni, pivot, pose originali 1–5 e 8–10 (6 e 7 escluse su richiesta), ordine circolare di 14 frame e durate identiche alla GIF. Periodo 1,36 s.
- Fonte: spritesheet `15230.png`, Library `libfile_bca5adfd22488191ab7bbde1ed59d37b`; GIF approvata `Hellscape_diavolo_8_pose_ABA_v1.0.0_20261030.gif`, Library `libfile_073e370172788191b062b8d2746245d8`. I prompt della generazione precedente non sono ricostruiti né inventati in questa integrazione.
- Ruolo: otto creature sul piano del cielo, dietro il ponte; larghezze logiche 25/37/49/61 px, quattro distanze, direzioni speculari e fasi alari sfalsate. Scala uniforme sull'intero sprite, senza deformare anatomia o materiali.
- Cinematica: velocità orizzontali nel mondo ±10/15/20 unità/s, inferiori alle 48 unità/s della corsa. Posizione proiettata = posizione iniziale + (velocità × tempo − distanza effettiva telecamera) × profondità. La telecamera segue Cerbero: in corsa entrambi i versi scorrono verso sinistra, con velocità apparente attenuata per i più lontani. Durante rallentamenti/arresti della camera si usa il suo spostamento effettivo; pausa e movimento ridotto seguono l'orologio condiviso.
- Sostituito il disegno procedurale delle vecchie sagome nere, rimosso dal renderer. Il caricamento della scena attende anche il nuovo atlas. Cerbero, veicoli e regole di gioco conservano gli asset e la logica esistenti.
- Verifiche: test di ordine/timing/loop, dimensioni atlas, velocità relative e parallasse; suite automatica e registrazione reale del browser documentate nella PR. Nessun nuovo prompt di generazione: l'intervento assembla e riproduce materiale già approvato.
