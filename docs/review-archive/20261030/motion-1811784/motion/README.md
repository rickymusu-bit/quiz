# PR A — locomozione

Revisione sorgente: `18117848b0ea9984eab6ec052a1738bbc43139ed`.

Screenshot originali del vero HTML offline generato da questa revisione. `stride-sequence.png` accosta quattro fotogrammi del Canvas distanti 300 ms; non modifica gli sprite. Il report contiene i quattro casi desktop/Android e l'assenza di errori e richieste esterne.

Per rigenerare HTML, GIF e screenshot: `npm ci && npm run test:motion` (Chromium e dipendenze Python di requirements-test.txt). Aprire `dist/Hellscape-review.html`, poi **Scenari di revisione → Corsa / locomozione**. Il pacchetto della CI include lo stesso export, la GIF e gli screenshot: https://github.com/rickymusu-bit/quiz/actions/runs/40641456807#artifacts.

Questo ramo aggiunge soltanto materiale di revisione alla sorgente della PR #32 e non viene unito a main.
