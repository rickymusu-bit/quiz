# Verifica delle correzioni v1.3.0

Base richiesta: `fix/malocchio-preview-spec-20261028`, commit `3dec47a`.
Versioni: applicazione 3.9.0, motore/salvataggi 2.4.0, regole 21.0.0.
La specifica vincolante resta [v1.3.0](HELLSCAPE_CORREZIONI_CODEX_v1.3.0.md).

## Implementato

- Malocchio: preservata l’assenza delle alternative dal DOM durante la scelta. Aggiunta verifica browser di DOM, accessibilità, scorciatoie, passaggio e timer; il timer parte alla conferma anche se la notifica del passaggio è ancora animata.
- Flagello: tutti gli attivi, autore incluso, perdono simultaneamente una vita, l’intero inventario e `min(punti, 666)`. Le frazioni restano esatte, i punteggi non diventano negativi, il Sigillo dei superstiti resta attivo. Verificati autoeliminazione, ultimo superstite e Game Over collettivo.
- Antisigillo: tipo, probabilità indipendente 30%, migrazione delle probabilità, persistenza, bersaglio protetto obbligatorio, dissipazione senza riflesso né altri danni. Icona SVG dedicata, inventario paginato, impostazioni, guida e scena Ammo aggiornati.
- Ultimo Miglio: ingresso solo dopo l’ultima domanda ordinaria, soli primi classificati pari; domande difficili nuove anche con filtro ordinario facile. Conservazione delle vite, errore/timeout −1, punteggi congelati, completamento del giro e rifornimento senza ripiego su facile/media.
- Ponte: eliminata la fascia della ringhiera della carreggiata; aggiunti pilastri, rovine laterali e detriti deterministici. Solco e macerie seguono le coordinate del ponte.
- Regia: nessuna fila unica dei perdenti; il demone raggiunge ciascun veicolo nella sua corsia. Cattura, fiammata direzionale con luce, presa e inghiottimento; scorrimento continuo durante catture, finali e dopo il verdetto.
- Portale: discesa dall’alto, impatto nella strada, apertura per un veicolo, attraversamento in marcia, crollo e macerie permanenti nel mondo. Il demone resta prima del piano del portale e reagisce dopo il crollo.
- Rendering: smoothing di qualità, coordinate subpixel, raster proporzionato a CSS e DPR (DPR dispositivo massimo 2, scala raster massima 3), compositing del demone alla stessa risoluzione; limite di 30 FPS con movimento dipendente dal tempo. Asset delle sei silhouette mantenuti.

## Migrazione e compatibilità

I salvataggi ordinari precedenti conservano domande, punti, danni, sanzioni e pesi già scelti; il peso Antisigillo mancante riceve 30. Le copie Antisigillo già presenti vengono validate.

Il vecchio spareggio cancellava i danni ordinari e imponeva una vita. Nei salvataggi già entrati in quella fase si conserva quella vita effettiva: i danni cancellati non sono ricostruibili con certezza e gli eliminati non vengono resuscitati. Una domanda facile/media ancora aperta viene ritirata sullo stesso turno, mantenuta fra quelle viste/annullate se già svelata, e sostituita da una difficile nuova. Gli esiti storici conservano il quesito originale. La migrazione è coperta da test.

## Verifiche riproducibili

```sh
npm ci --cache /tmp/quiz-npm-cache
npm test
npm run test:browser
npm run test:frames
npm run build
npm run test:offline
npm run test:v130
npm run audit:render
python3 tests/responsive.py
python3 tests/endings.py
python3 tests/chase_browser.py --quick
python3 tests/portal_browser.py --quick
python3 tests/tie_browser.py --quick
```

I test browser usano Chromium reale. Gli scenari v1.3.0 impostano partite controllate con il vero motore e acquisiscono PNG del vero renderer, senza mockup o HTML consegnati come anteprima. I parametri e i risultati sono in [evidence.json](screenshots/v130/evidence.json); i tempi del renderer sono in [render-audit.json](screenshots/v130/render-audit.json).

Il test offline carica gli esatti byte del build tramite intercettazione locale delle richieste, a rete disattivata. L’apertura diretta `file://` è bloccata dalla policy del Chromium gestito; non è stata dichiarata verificata.

## Audit sorgente → atlante → raster

| Elemento | Sorgente usata | Trattamento |
| --- | --- | --- |
| Veicoli | 1254×1254, 48 pose | Crop di silhouette complete con padding; dimensioni e rapporti relativi conservati; filtro di qualità e niente arrotondamenti di posizione |
| Demone corsa | 1536×1024, 12 pose | Interpolazione temporale e compositing; stessa scala fisica tra scene |
| Demone finale | 1536×1024, 16 pose; crop normalizzato 438×258 | Mani e bocca ancorate; buffer adattivo al raster principale |
| Ammo | 1330×1182, celle circa 443×394 | L’UI usa l’atlante illustrato al posto del vecchio atlas 48 px; Antisigillo vettoriale |
| Ponte / lava | 2172×724 / 1536×1024 | Campionamento della carreggiata senza ringhiera; supporti, rovine e detriti proiettati proceduralmente |
| Portale | 1086×1448 | Proiezione del piano, pareti estruse, apertura allineata alla corsia del vincitore |
| Titoli / home | 1981×793 / 2172×724 | Asset originali, proporzioni native mantenute |

Profilo in Chromium headless del workspace, 2,5 secondi per viewport: desktop 1440×1080 DPR 1 circa 23.2 FPS e CPU p95 9.8 ms per paint; mobile emulato 390×844 DPR 2 circa 27.2 FPS e CPU p95 5.8 ms. Raster osservati rispettivamente 1440×1080 (5,93 MiB RGBA) e 780×585 (1,74 MiB). Il limite assoluto del singolo canvas è 1536×1152 (6,75 MiB); il compositing del demone usa un secondo buffer limitato allo stesso modo. Non è una misura su hardware Android fisico né della memoria complessiva del browser.

## Limiti visivi ancora aperti

Gli atlanti illustrati del demone e dei veicoli sono quelli originali: non è stata eseguita una nuova generazione artistica HD. In particolare il crop del demone finale può ancora essere ingrandito fino a circa 1,5× al massimo raster. Le transizioni fra pose usano compositing e possono mostrare sovrapposizioni delle silhouette; non equivalgono a una nuova animazione scheletrica. Colonne, pilastri e macerie sono geometrici e procedurali: la loro finitura è meno illustrata degli asset originali.

La logica e gli eventi delle nuove scene sono implementati, ma il criterio di qualità artistica uniforme P1 richiede ancora revisione e possibile rifinitura degli asset. La PR resta draft per rendere esplicito questo lavoro residuo. Nessun merge automatico.

## Screenshot reali

Le immagini raccolte nella [galleria](screenshots/v130/README.md) includono partita ordinaria, Malocchio, Antisigillo, Flagello, Ultimo Miglio, cattura, discesa/impatto del portale, attraversamento e macerie, su desktop 4:3 e mobile verticale/orizzontale. I nomi riportano viewport e DPR. Nessun HTML di anteprima è allegato.
