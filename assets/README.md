# Risorse visive di Fool

- `fool-logo.png`: versione corrente del logo, con le superfici blu portate a grigio antracite/nero su richiesta del responsabile. Revisione realizzata tramite editing dell’immagine di riferimento, conservando lettering e accenti arancioni/dorati. È usata in schermata iniziale, intestazioni e icona.
- `fool-logo.jpg`: riferimento originale fornito da Riccardo Musumarra nella richiesta del 21/10/2026, allegato `15033.jpg`. I byte dell'immagine originale sono conservati. Un filtro SVG del sito rende trasparente il fondo quasi nero in fase di visualizzazione e mantiene i colori della grafica; il riferimento JPEG originale non viene riscritto.
- `doom-background.png`: sfondo generato a partire dal riferimento `15034.jpg`, con cielo rosso e pavimento di pietra, estetica pixel ispirata a Doom del 1993. Non contiene scritte o loghi del riferimento. L'originale generato è stato conservato nell'ambiente di lavoro e copiato nel progetto.
- `vt323-regular.ttf`: carattere VT323 di Peter Hull, Google Fonts, distribuito con SIL Open Font License 1.1. La licenza completa è in `vt323-license.txt`. Origine: `google/fonts/ofl/vt323/VT323-Regular.ttf`, blob `afa69098f15bf64849d397f133d9467486904053`.

Le risorse sono servite dal sito stesso, senza richieste a CDN o servizi di caratteri esterni. Il filtro del logo è in `src/logo-filter.svg`; home, gioco e presentazione usano la stessa identità visiva.
