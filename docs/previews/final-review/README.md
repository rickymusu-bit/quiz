# Verifica integrata: corsa, catture e portale

GIF reale da Chromium, revisione `3a11c2c99f034f4c5c28f57197c3de2706fff307`.
Viewport 1024 × 768, esportazione 640 × 480, **27 secondi**, 216 fotogrammi a
8 FPS. La fixture ha Aster su chopper, Moro su pick-up e Vespro su Ape: le
sanzioni eliminano i due avversari tramite il vero motore. Il renderer esegue
poi le due catture e la fuga del superstite. Nessun mockup o asset generato
viene presentato come acquisizione del gioco.

![Sequenza integrata reale](integrated-gameplay.gif)

Il rapporto verifica stato del motore invariato durante la cinematica, due
bersagli distinti, nessuna resurrezione, camera continua, portale attraversato
e macerie permanenti. La palette riserva colori reali all’oro: su 2186 pixel
campionati, errore medio di tinta 1,74° e frazione spostata verso arancione 0,32%.
[Schermata ordinaria](ordinary.png), [esito](victory.png), [rapporto](report.json).

Le suite hanno verificato gli stessi moduli di gameplay/renderer, rimasti
identici alla revisione `772660a`; la PR interviene su test, audit e documenti.
GIF e audit conclusivi provengono dalla revisione indicata sopra. Le fonti,
i criteri e i limiti sono nella [verifica finale](../../HELLSCAPE_VERIFICA_FINALE_2026-10-28.md).

| Controllo | Esito | Log |
| --- | --- | --- |
| Unità e dataset | 145 test passati e due banche verificate | [unità](logs/unit.txt) |
| Fotogrammi | Tutte le suite passate | [frame](logs/frames.txt) |
| Build standard | Passata | [build](logs/build.txt) |
| Browser generale | Suite completa passata | [browser](logs/browser.txt) |
| Offline | Due banche in tre viewport, otto animazioni e scenari, nessuna richiesta esterna | [offline](logs/offline.txt) |
| Accettazione v1.3.0 | Motore e browser passati, con richieste successive prevalenti | [v1.3.0](logs/v130.txt) |
| Catture | 0/1/2 perdenti, 8 campioni offline | [catture](logs/chase.txt) |
| Portale | 8 campioni offline e sequenza completa | [portale](logs/portal.txt) |
| Ultimo Miglio | 2 viewport/DPR, round, vite, input, ripresa e Game Over | [Ultimo Miglio](logs/tie.txt) |
| Audit isolato | Dimensioni, DPR, copertura nativa e timing raccolti | [audit](logs/render-isolated.txt) |
| Registrazione | Stato, camera, superstite, rocce e oro verificati | [GIF](logs/capture.txt) |

I campioni del rendering isolato misurano circa 23,9 FPS a 1440 × 1080 DPR 1,
15,4 FPS al raster massimo su desktop DPR 2 e 30,0 FPS a 390 × 844 DPR 2.
Non sono misure su hardware Android fisico. L’illustrazione della home arriva
a circa 1,61× la sorgente sul desktop DPR 2; i veicoli restano entro i pixel
nativi alle dimensioni di corsa e anteprima. Questi limiti restano visibili
nel [rapporto di rendering](render-audit.json) e nella [copertura nativa](native-coverage.json).
