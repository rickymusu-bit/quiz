# Hellscape — ciclo di cemento con giunzione AB → B approvata

**Versione:** 1.1.0 · **Data:** 2026-11-01.

**Fonte e autorizzazione:** l’utente ha approvato l’anteprima ritoccata: «va bene. aggiorna AB e B con questa nuova giunzione. poi carica su github. poi parliamo di parallasse dello sfondo».

**Stato:** aggiornamento dell’archivio di asset e delle sue anteprime. Nessuna integrazione nel runtime, modifica del renderer, implementazione della parallasse o merge.

## Asset correnti

Sequenza A → AB → B → BC → C → CA → A. Altezza comune 724 pixel, periodo 9845 pixel. Dimensioni e posizioni sono conservate in [ciclo.json](ciclo.json).

AB corrente è il file approvato nella conversazione, 1090 × 724 pixel. Solo gli ultimi 140 pixel di larghezza sono interessati dal montaggio del ritocco; i primi 950 pixel restano identici all’AB precedente. Il master B, 2172 × 724 pixel, è conservato con identici byte e pixel. La coppia AB/B corrente riproduce quindi esattamente la giunzione approvata, senza modificare il resto di B o la successiva giunzione B → BC.

A, BC, C e CA non cambiano. L’identità del quartiere resta quella richiesta dall’utente: cemento armato, acciaio e asfalto, palette fredda, architetture industriali monumentali. La precedente descrizione della pietra caotica non prevale su questo brief.

## Provenienza del ritocco

Il generatore ha ricevuto in una singola chiamata la [giunzione originale](source/guides/AB_B_prima_ritocco.png), composta dagli ultimi 480 pixel di AB e dai primi 480 pixel di B. Sono conservati il [prompt realmente usato](prompts/AB_B_ritocco_locale.txt) e l’[output grezzo](source/generated/AB_B_ritocco_locale.png), 1444 × 1089 pixel. L’output grezzo ha modificato dettagli anche fuori dall’area richiesta; non viene usato direttamente come sostituzione di AB/B.

Il risultato generato è stato riportato a 960 × 724 pixel e montato soltanto nel lato AB della giunzione, nelle aree del cavalcavia superiore, ponte intermedio e asfalto. Il montaggio impiega una maschera locale sfumata, rifinitura del bordo e correzione graduale del tono dell’asfalto. Nessun pixel della metà B della giunzione viene sostituito. L’anteprima montata e il PNG AB ottenuto sono i file approvati dall’utente; in questo aggiornamento non sono state effettuate nuove generazioni o ulteriori ritocchi.

L’[AB precedente](source/history/hellscape_cemento_AB_prima_ritocco.png) resta conservato per la tracciabilità delle generazioni e dei ritagli originali. [generazioni.json](generazioni.json) distingue le generazioni iniziali dal ritocco locale; [provenance/AB_B_ritocco_approvato.json](provenance/AB_B_ritocco_approvato.json) registra input, output, hash, area modificata, controlli e approvazione. La [scheda 1.0.0](HELLSCAPE_CEMENTO_CICLO_v1.0.0_20261101.md) documenta il procedimento storico precedente.

## Anteprime aggiornate

La [giunzione AB → B](previews/AB_B.png) accosta i file correnti alla scala 1:1, con taglio a x=480; non contiene sfumature aggiuntive tra i due asset. Le altre cinque anteprime restano valide e vengono ricontrollate rispetto agli asset correnti.

Il [panorama del ciclo](previews/hellscape_ciclo.png) è ricostruito accostando i sei asset correnti senza sovrapposizioni o ridimensionamenti. Il [video](previews/anteprima_scorrimento.mp4) è rigenerato da questo panorama: 1448 × 724 pixel, 30 FPS, 985 fotogrammi, circa 32,83 secondi. [Metadati e hash del video](provenance/anteprima_scorrimento.json). [Script di rigenerazione](provenance/rigenera_anteprima.py).

Il video è un’anteprima di montaggio degli asset, **non una registrazione del gioco**. L’approvazione visiva di AB → B non certifica automaticamente la perfezione di tutte le giunzioni o un comportamento già verificato nel runtime.

## Verifiche

Controllati integrità PNG, altezza comune, dimensioni e posizione dei sei asset; identità dell’AB corrente rispetto al file approvato e di B rispetto al master originale; corrispondenza dei pixel della giunzione approvata, del panorama e delle sei anteprime. I ritagli delle generazioni storiche sono verificati rispetto all’AB precedente conservato e a BC/CA correnti. Verificati metadati del nuovo video tramite ffprobe, hash e collegamenti relativi.

[file_manifest.json](file_manifest.json) e [SHA256SUMS](SHA256SUMS) identificano i file correnti. Le differenze numeriche al bordo in [verifica_giunzioni.json](provenance/verifica_giunzioni.json) sono descrittive e non sostituiscono la valutazione visiva.

## Registro

- **1.1.0 — 2026-11-01:** pubblicazione sul branch della giunzione AB → B approvata, con AB aggiornato, B originale conservata, panorama/video rigenerati e provenienza completa.
- **1.0.0 — 2026-11-01:** primo archivio dei sei asset, guide, prompt, completamenti, giunzioni e video.
