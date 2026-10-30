# Diavolo volante — volo v1
Data: 30 ottobre 2026. Fonte: main ec4eb85057da38b821e3c2ae00ee0dcc017f418f.
Protocollo: docs/PROTOCOLLO_SPRITE_ANIMATI_v8_20261029.md (§2.1, §7.2–7.5, §8.1).
Stato: produzione artistica; design candidato generato, in attesa di approvazione, nessuna approvazione o integrazione.

## Audit verificato
- Ispezionati assets/hell-race.js (blob 02459dce3bd0c5cc97132cf2535ff908eb1c47b3), docs/HELLSCAPE_LAYOUT.md e asset infernal-world-v1.webp (blob 20952a8b76a320295337cd03ec48f146bcc3fb08, aperto visivamente).
- Gioco pubblico osservato direttamente: https://rickymusu-bit.github.io/quiz/Fool.html?start=1, App 3.11.2, 30/10/2026. Screenshot acquisito dopo caricamento completo: references/scena-reale-20261030.jpg. La pagina pubblicata non espone lo SHA: non attestata identità del deployment con main.
- Screenshot browser: viewport 1363×936; Canvas osservato 1248×936, rettangolo CSS 1248×936. Contratto logico 512×384; raster adattivo, non un buffer fisso 512×384.
- Scene laterale della corsa, ma piccoli diavoli quasi frontali: entrambe le ali visibili ai lati del busto. Il nuovo design segue questa vista, senza dedurre automaticamente una vista laterale dalla camera della corsa.
- devilPosition: otto istanze, x avvolta su larghezza+90; y=25+((i*3)%8)*17+sin(t*.65+i*2)*1.4; scale .48/.545/.61. Disegno nominale 64×60, circa 31–39×29–37 pixel logici; origine disegno (-32,-24). Alternate specchiature orizzontali già nel renderer.
- Il renderer attuale usa devilFrame procedurale 192×180 e 16 fasi a 5.5 cambi/s; questa è una baseline, non una sequenza disegnata approvata. Nuovo ciclo ancora da progettare/approvare dopo il design.
- Ruolo decorativo, secondo piano, sopra la lava e dietro ponte/Cerbero/veicoli/UI. Nel risultato caricato il fondale è un mare di lava; infernal-world è un riferimento aggiuntivo/fallback e non viene spacciato per il fondale finale osservato.
- Sagoma bruno/bordeaux scuro, bordi caldi discreti; la leggibilità a scala reale prevale sul dettaglio del concept.

## Brief proposto
Un solo soggetto: testa/collo/busto collegati, due corna, due braccia, due gambe, due ali membranose ancorate al dorso, una coda. Ossa e corna rigide, membrane flessibili; niente attrezzatura o effetti.
Camera quasi frontale compatibile con la baseline osservata; busto centrato, ali in massima salita come primo candidato A. Pivot toracico da misurare sul PNG, non coordinate inventate.
Dimensioni di esportazione e alpha da verificare sull'output effettivo. Nessuna immagine canonica nuova approvata: la prima generazione propone il design.

## Progressione
Design statico/A candidato → approvazione design → piano di movimento e tempi → B → breakdown → intermedi selettivi e loop locale → approvazione → integrazione separata e GIF reale dal browser.
Non fissato un numero di PNG o una durata prima del blocking. Nessun file in approved/ finché l'utente non approva.
I prompt espliciti sono conservati prima di ogni chiamata; le istruzioni interne del servizio non sono accessibili.
