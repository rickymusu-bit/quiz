# Verifica integrata Hellscape — 28/10/2026

Applicazione 3.9.0, motore/salvataggi 2.8.0, regole 25.0.0.
Questo rapporto integra la specifica v1.3.0 con le successive richieste dell’utente.
Il testo dei documenti storici non ripristina colonne scartate o regole superate.

## Regole correnti e consegne

| Ammo | Probabilità predefinita indipendente | Comportamento corrente |
| --- | --- | --- |
| Catene | 30% | Salto del prossimo turno ordinario del bersaglio; nessuna vita persa |
| Tributo | 30% | Trasferisce subito il 33% esatto dei punti attuali; chi lo usa rinuncia al turno corrente |
| Malocchio | 30% | Mostra testo e valore senza alternative; errore/timeout perde il valore fino a zero; premi al rispondente e rotazione dopo l’autore |
| Sigillo | 30% | Tre turni personali di immunità; niente uso/guadagno Ammo; Livella esclude i protetti; Flagello e Antisigillo restano efficaci |
| Contrappasso | 30% | Attivazione su di sé, tre turni personali: punti ×2 alle corrette, penalità ×2 agli errori/timeout fino a zero; niente trasformazioni passive |
| Livella | 15% | Ripartizione esatta dei punti fra i non eliminati e non protetti |
| Flagello | 5% | Tutti gli attivi perdono una vita, l’inventario e fino a 666 punti; nessun verdetto prima di risolvere tutti gli effetti |
| Antisigillo | 20% | Dissipa il Sigillo di un solo avversario protetto, comprese le restrizioni, senza danni |
| Sacrificio | 5% | Chi lo usa perde una vita e riceve 777 punti, anche se l’ultima vita lo elimina |

Le probabilità restano configurabili singolarmente. I due contatori personali
comprendono il turno di attivazione e scadono all’inizio del quarto. Con
Malocchio e Contrappasso il rischio complessivo è ×2; Sigillo non annulla rischi
propri già attivati. L’Ultimo Miglio conserva le vite residue, usa solo domande
difficili nuove, congela punti e Ammo e completa tutte le risposte dovute nel giro.

Consegne e GIF reali: [ponte](design/black-stone-bridge/README.md),
[portale in pietra e oro](previews/portal-stone-gold/README.md),
[Antisigillo](previews/antisigillo/README.md),
[Sacrificio/Tributo](previews/ammo-rules/README.md),
[Malocchio](previews/malocchio/README.md), [Sigillo](previews/sigillo/README.md),
[Contrappasso](previews/contrappasso/README.md).
Ogni consegna conserva la propria revisione di acquisizione.

## Intervento di verifica integrata

- Allineato `tests/configurable.py` alle nove Ammo: estrazioni garantite di tutti
  i tipi, seconda pagina dell’inventario con Antisigillo e Sacrificio, probabilità
  correnti e secondo Sigillo disabilitato senza consumo durante la protezione.
- Esteso `scripts/render-audit.cjs` con revisione, desktop DPR 2, tutti i nuovi
  PNG Ammo, dimensioni effettive della home e misure dei crop nativi impiegati
  dalla corsa e dalle anteprime. Il controllo fallisce se un veicolo richiede
  un ingrandimento oltre i pixel nativi alle dimensioni attuali.
- Aggiunta acquisizione riproducibile della sequenza integrata in
  `scripts/capture-final-review.py`: partita, due catture in corsia, discesa,
  attraversamento e crollo del portale, oro preservato nell’esportazione.
- Chiarita la precedenza delle richieste successive nei documenti storici.
  Nessuna modifica a regole, asset approvati o moduli di gameplay in questa PR.

## Audit dei pixel e limiti

Il raster logico è 768 × 576; il massimo fisico è 1536 × 1152, ossia 6,75 MiB
RGBA per il Canvas principale. La risoluzione della home è misurata dal DOM,
con CSS e DPR effettivi. Le misure native usano le stesse funzioni di crop e
dimensionamento del renderer in una VM isolata, senza cambiare una partita.

| Mezzo | Crop nativo | Destinazione massima corsa | Anteprima massima | Rapporto massimo destinazione/sorgente |
| --- | --- | --- | --- | --- |
| Chopper | 180 × 146 | 109,12 px | 118,8 px | 0,660 |
| Pick-up | 171 × 166 | 143,84 px | 156,6 px | 0,916 |
| Camion | 168 × 158 | 153,76 px | 167,4 px | 0,996 |
| Coupé | 179 × 103 | 133,92 px | 145,8 px | 0,815 |
| Fuoristrada | 170 × 132 | 138,88 px | 151,2 px | 0,889 |
| Ape | 168 × 149 | 99,2 px | 108 px | 0,643 |

Tutti i 48 fotogrammi mantengono silhouette complete e padding. Le dimensioni
al doppio approvate dall’utente restano invariate. Le sorgenti dei veicoli coprono le dimensioni misurate, compresa l’anteprima.

Il demone di corsa ha crop 416 × 286: al massimo raster il corpo può raggiungere
442 px di larghezza, circa **1,063×** la sorgente. Le 16 pose del finale usano
crop 438 × 258, circa **1,009×** a quella larghezza. Resta una lieve espansione
al limite superiore; questa consegna non è una nuova generazione artistica HD
né un’animazione scheletrica. Ponte e lava condividono il riferimento di camera;
portale di taglio, dettagli dorati e rocce volumetriche sono gli asset approvati.
Le colonne decorative sono scartate.

Il rapporto di timing misura la durata a parete del callback RAF, compresi
scheduler e GC: non è un profiler della CPU. La misura isolata conclusiva è
raccolta dopo gli altri test; i campioni preliminari con browser concorrenti
non vengono usati come prova di prestazioni su un telefono fisico.

La home a 1440 × 1080 misura circa 1162 × 872 CSS per l’illustrazione 1448 × 1086:
a DPR 2 raggiunge **1,61×** la sorgente. Il logo 2172 × 724 resta entro la sorgente.
Questo è un residuo concreto del requisito di qualità uniforme, da affrontare
nel prossimo intervento grafico separato. La profilazione isolata del renderer
rileva circa 23,9 FPS desktop DPR 1, 15,4 FPS desktop DPR 2 al limite del raster
e 30,0 FPS sul mobile emulato DPR 2; i callback RAF p95 sono rispettivamente
8,0 / 6,1 / 1,7 ms. I tempi non comprendono un profiling separato del compositing.

## Verifiche

Confermate prima della registrazione conclusiva:

- `npm test`: 145 test e verifica delle due banche.
- `npm run test:frames`: nove icone, 48 pose veicoli, 12 pose demone, proporzioni,
  polvere, 16 pose del finale e terreno.
- `npm run build` e build di revisione/offline.
- `npm run test:browser`: interfaccia completa, due banche, desktop/mobile,
  tastiera, impostazioni, inventari, Ammo, cinematiche e regressioni UX.
- `npm run test:v130`: controlli del motore e schermate reali di Malocchio,
  Antisigillo, Flagello, Ultimo Miglio, cattura e portale.
- `python3 tests/chase_browser.py --quick`: 0/1/2 perdenti, ancoraggi,
  occlusioni, pausa/orientamento, nessuna resurrezione e 8 campioni offline.
- `python3 tests/portal_browser.py --quick`: attraversamento prima del crollo,
  reazione del demone, pausa/orientamento, Game Over/movimento ridotto e 8 campioni offline.

Sono passate anche `npm run test:offline`, `python3 tests/tie_browser.py --quick`,
l’audit isolato e l’acquisizione integrata. Log, misure e GIF reale di 27 secondi
sono nella [consegna finale](previews/final-review/README.md). Non sono state
ripetute tutte le matrici di revisione artistica né prove su hardware Android
fisico. L’URL `file://` è bloccato dal browser gestito: la prova offline carica
gli stessi byte della build tramite una sola risposta locale intercettata,
con rete disabilitata, senza dichiarare verificata l’apertura diretta da file.

Nessun merge o pubblicazione automatici. Le PR restano disponibili per revisione.
