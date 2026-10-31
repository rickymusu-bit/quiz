> **Concept superato per il nuovo Hellscape:** la [specifica Bafometto v1.1.0](HELLSCAPE_BAFOMETTO_DIREZIONE_CINEMATICA_v1.1.0_20261031.md) prevede una **porta finale integrata nel percorso**, non un portale che emerge dalla lava o cade dall'alto. Il testo seguente è conservato solo come documentazione del vecchio runtime e della sua evoluzione. Nessun nuovo finale è stato implementato.

> Documento storico. Per regole, corsie, portale dall’alto e crollo si applica [la specifica v1.3.0](HELLSCAPE_CORREZIONI_CODEX_v1.3.0.md).

# Portale, ponte ed epilogo — PR D

Quarta fase della specifica cinematografica 1.2.0, dopo il merge della PR C.
Il motore rimane autorevole: regole, punteggi, turni, Ammo e salvataggi non cambiano.

## Spazio e architettura

Il ponte espone una proiezione obliqua condivisa: `x` è la distanza lungo la
strada, `depth` la posizione trasversale, `z` l'altezza sopra il piano.
`project()` sottrae la distanza della telecamera, applica lo scarto trasversale
e proietta l'altezza verticalmente. Non esiste un punto di fuga separato per il
portale. Anche tagli, raccordo, detriti e immersione usano questa trasformazione.

Il portale occupa una profondità di 150 pixel logici, contro i 110 del ponte.
Il suo piano è trasversale alla corsa: il mezzo prosegue diritto e attraversa
la soglia sul proprio appoggio, senza girare o cambiare scala. Le colonne
superano i bordi del ponte; le fondazioni arrivano alla lava. La facciata in
marmo e oro viene proiettata sul piano del mondo; i fianchi estrusi le danno
spessore. I due semipiani architettonici sono disegnati dietro e davanti agli
attori secondo la profondità. Il taglio della fondazione avviene alla quota
dell'acqua nel mondo, prima della proiezione, anche sui fianchi.

La posizione del portale è calcolata davanti al veicolo realmente rimasto.
La camera anticipa la soglia e rallenta; i mezzi continuano a progredire nel
mondo e il demone conserva la distanza dei passi. L'architettura non dipende
dalla larghezza CSS o dal DPR del dispositivo.

## Causalità e conclusione

Il tetto emerge dalla lava e raggiunge il piano del ponte: questo contatto
determina l'istante della frattura. Si rompono parapetti e parti esterne del
piano; frammenti cadono e si immergono. Il raccordo centrale resta percorribile
fino al passaggio. La luce bianca e azzurra si apre dopo l'emersione completa.

Il veicolo viene tagliato dal piano reale della soglia, dalla parte anteriore
al retro, conservando l'intera sagoma e il pilota. Solo dopo che anche il retro
ha superato lo spessore del portale, questo si chiude e sprofonda. Il raccordo
cede dopo il passaggio; la frattura rimane visibile anche a portale scomparso.

Il demone si arresta, anticipa e scarica tre colpi con entrambi i pugni, senza
salti. Ogni impatto ha polvere, frammenti e uno scuotimento limitato. Seguono
una sola grande fiammata dalle fauci e un breve affanno con piedi piantati.
Soltanto alla fine compare **VITTORIA**, con il nome reale e il sottotitolo
**[Nome] è fuggito dall'inferno!**. La vecchia sequenza con ruggito non viene
riprodotta. Game Over conserva cattura e danza, senza portale o ponte distrutto.

Tutti i tempi sono centralizzati in `hell-epilogue.js`. Il campionamento è puro,
senza timer aggiuntivi o RNG. Pausa, ridisegni, orientamento e scheda nascosta
conservano il clock; il movimento ridotto presenta il quadro conclusivo statico.
La UI riceve una sola conclusione quando il titolo può diventare visibile.

## Moduli, asset e verifica

- `hell-epilogue.js`: traiettorie, tempi, attraversamento e cause della frattura.
- `hell-portal.js`: materiale, proiezione della facciata, luce, spessore e lava.
- `hell-bridge.js`: proiezione comune, piano, fratture, raccordo e detriti limitati.
- `hell-ending.js`: composizione degli attori e occlusioni, pose e fiammata.

I nuovi master sono descritti nel README degli asset. Gli originali precedenti
restano nell'archivio; il vecchio portale e il titolo WINS non vengono più
caricati o incorporati nell'HTML. I nuovi WebP mantengono gli esatti pixel RGBA
dei PNG generati, senza ridimensionamento o sharpening.

`npm run test:portal` verifica proiezione e causalità, sei sagome di veicolo,
campionamento a 30/60/144 FPS, stato invariato e riproduzione nel vero export
offline. Il browser controlla pausa, orientamento, scomparsa completa prima
della discesa, ordine dell'epilogo, titolo, Game Over e movimento ridotto;
campiona quattro fasi su cinque viewport a DPR 1/2. Produce immagini, GIF e
misure in `artifacts/portal/`. L'anteprima aggiunge i fotogrammi di emersione,
frattura, portale aperto, attraversamento, discesa, pugni, fuoco e affanno.
