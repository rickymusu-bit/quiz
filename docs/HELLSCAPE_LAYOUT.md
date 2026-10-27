# Hellscape — palco 4:3 e interfaccia leggibile

Seconda PR preliminare della specifica cinematografica 1.2.0, dopo l'audit e il
ripristino del logo della PR #30. Questa modifica riguarda layout, accessibilità
e adattamento a schermo; non implementa ancora le nuove cinematiche A–D.

## Un solo contratto di dimensioni

`assets/hell-layout.js` definisce il riferimento **1024 × 768**, il buffer della
scena **512 × 384**, il rapporto e la trasformazione uniforme di contenimento.
La scena legge da questo contratto le dimensioni del Canvas; il controller
pubblica in CSS `--stage-width`, `--stage-height`, `--stage-ratio`,
`--scene-max-width` e `--scene-max-height`. Home, gioco, regole e anteprima Ammo
caricano lo stesso modulo. Le tre implementazioni precedenti di `fit` sono
rimosse; il comando pubblico `fitFoolViewport()` resta disponibile.

Su uno schermo che contiene il riferimento senza ridurlo, il palco mantiene
la composizione originale e viene ingrandito uniformemente. Se la scala di
contenimento sarebbe inferiore a 1, il controller attiva il layout compatto:
solo la scena mantiene il contenimento 4:3, mentre l'interfaccia usa pixel CSS
nativi. Non si rimpiccioliscono testi e controlli su telefoni o finestre basse.

Esempi di area massima della scena: 1920 × 1080 → 1440 × 1080;
1366 × 768 → 1024 × 768; 390 × 844 → 390 × 292,5;
844 × 390 → 520 × 390. Coordinate, prospettiva e raster non cambiano con il
viewport o il DPR. Il buffer più grande, da solo, non aggiungerebbe dettaglio
agli sprite: questa PR lo conserva e verifica che i pixel restino identici
attraverso il cambio di orientamento in modalità movimento ridotto.

## Reflow e scorrimento

- **Home:** l'illustrazione e il logo mantengono le proporzioni; il menu segue
  l'immagine, con pulsanti alti almeno 48 pixel CSS (52 per le azioni principali).
  I suggerimenti di tastiera sono visibili nella composizione desktop.
- **Preparazione e impostazioni:** campi e selettori restano alti almeno 44
  pixel. Le colonne si dispongono in verticale sugli schermi stretti; non viene
  tagliato il fondo della configurazione.
- **Quiz:** scena 4:3, barra tempo, domanda, turnazione e Opzioni sono sezioni
  successive. Il testo della domanda resta a 19 pixel CSS, le alternative a 17,
  la soluzione a 16; su telefono le quattro risposte occupano una colonna.
  In orizzontale la domanda entra in vista quando viene svelata, senza lasciare
  il timer attivo dietro una domanda ancora sotto l'area visibile.
- **Inventari e modali:** mantengono lo spazio e i controlli nativi. Le Ammo
  conservano le icone per ogni copia; lo scorrimento non diventa un conteggio.
- **Regole e finali:** i testi scorrono e i controlli rimangono utilizzabili.
  Il titolo finale conserva la grafica e la sequenza attuali.

Lo scorrimento è interno a `#viewport-stage`: non si introduce una barra
orizzontale nel documento. Le safe area vengono rispettate. Durante le
animazioni il controller porta in vista e centra la scena completa, blocca lo
scorrimento dei pannelli nascosti e sposta il focus sulla figura. Al termine
riporta in vista i controlli. Le scelte di layout non leggono o modificano lo
stato della partita; pausa, timer ed esiti restano gestiti dai moduli esistenti.

## Verifiche e artefatti

`npm run test:layout` verifica le cinque risoluzioni richieste (1920 × 1080,
1366 × 768, 1024 × 768, 844 × 390, 390 × 844), ciascuna a DPR 1 e 2:
geometria della scena, dimensioni effettive dei controlli, testo nativo,
assenza di overflow, orientamento e fullscreen. Confronta i byte del Canvas
e lo snapshot della partita prima e dopo il reflow, a scena ferma. Gli
screenshot sono in `artifacts/layout/`.

Le regressioni del motore, della persistenza, dei frame e del browser restano
attive; la verifica delle 200 domande controlla anche le soluzioni nelle due
banche. `npm run test:quality` continua a produrre 100 campioni offline e le
misure DOM a DPR 1/2, applicando il controllo 4:3 all'illustrazione/scena quando
il contenitore dei pannelli è responsive. `npm run test:offline` verifica
banche, risposte, regole, salvataggio/ripresa e isolamento dello storage.

La consegna della PR comprende screenshot aggiornati e
`dist/Hellscape-review.html` dalla medesima revisione, con gli scenari di
spareggio e vittoria esistenti. Il workflow conserva HTML, misure e screenshot.
Il browser gestito può bloccare `file://`: il test usa in quel caso gli stessi
byte con rete disabilitata tramite intercettazione locale. DPR e Android sono
emulati; non rappresentano una prova su un telefono fisico.

Regolamento, punteggi, estrazioni, turnazione e formato dei salvataggi non
cambiano. Locomozione del demone, nuova intro di spareggio, catture in fila e
portale monumentale rimangono le PR successive della specifica. Il merge di
questa PR richiede una nuova revisione del risultato visivo.
