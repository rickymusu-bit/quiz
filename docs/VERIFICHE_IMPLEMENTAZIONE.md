# Fool — implementazione e verifiche

## Finali WINS e GAME OVER — interfaccia 1.4.0, 22/10/2026

La vittoria mostra solo il nome del gruppo e WINS; l’eliminazione di tutti mostra GAME OVER. Le due scritte sono PNG trasparenti generati nel medesimo stile a pennellate rosse della X, ispezionati anche nei finali mobile. Un solo pulsante sotto l’esito torna alla home ufficiale. Non compaiono intestazione, tabellone, timer, toolbar, premio o indicazioni sul registro. La ripresa di una partita conclusa riapre lo stesso finale. Il testo del premio è rimosso da `src/app.js` e resta nelle regole, il cui sorgente non è stato modificato (SHA-256 `1aa2838af1177e4cee18cc9bf29cdf5df86ffbfaf44a3e272f4fdc6e897c36d5`). Nessuna modifica al motore o al formato dei salvataggi.

`tests/endings.py`: vittoria e sconfitta attraverso il pannello sanzioni su 240×320, 390×844, 844×390 e 1440×900; immagini caricate, esito accessibile, solo un pulsante, assenza di informazioni sul premio e comandi extra, ricarica/ripresa, home canonica e nome di gruppo molto lungo senza overflow; premio ancora presente nelle regole. `tests/sanctions.py` aggiornato e superato: due eliminazioni successive, nuovo finale, ripresa e ritorno alla home. Nessun errore JavaScript; screenshot finali mobile ispezionati.

## Sanzioni con −/+ e conclusione esplicita — interfaccia 1.3.2, 22/10/2026

Sostituiti gli input numerici delle sanzioni con pulsanti −/+ e output, limitati alle sanzioni ancora necessarie per arrivare a tre. Il totale futuro e l’eliminazione sono espliciti; gli interventi restano da confermare. Le scelte pendenti sono conservate nel browser. La conclusione del motore pulisce stato di pausa, motivo, sospensione, campanella e pannelli. Il renderer chiude il dialogo e gli avvisi residui, nasconde il timer e porta il focus al vincitore. Il normale caso di due eliminazioni successive risultava già vincente nel motore prima della modifica; la chiusura dello stato e la presentazione finale sono ora esplicite e coperte da regressione, senza attribuire una causa non riprodotta al blocco segnalato. La X corrente è un PNG generato trasparente, ispezionato e applicato direttamente; il precedente SVG non è più referenziato dall’app.

Verifiche: 30 test motore superati; regressione su tutti i sei ordini di due eliminazioni successive dagli stati domanda nascosta, risposta, scelta e risultato, con ripresa intermedia, più sanzione decisiva nello spareggio. `tests/sanctions.py` verifica −/+, limiti, annullamento, timer fermo, modifiche/motivi pendenti dopo ricarica, terza sanzione del secondo gruppo, vittoria del superstite, assenza di dialoghi/avvisi/pausa, ripresa del risultato e nuova partita a 240×320, 390×844, 844×390 e 1440×900. `tests/display.py` verifica il PNG e le liste su mobile/desktop; `tests/responsive.py` supera il flusso su dieci dimensioni, tastiera, touch e testo grande. Screenshot del pannello e della vittoria ispezionati; nessun errore JavaScript.

## Punti, bonus per riga e gruppi eliminati — interfaccia 1.3.1, 22/10/2026

Su richiesta del responsabile, la domanda mostra il valore in punti invece di argomento e difficoltà, prima e dopo lo svelamento. Il valore è quello base effettivamente configurato; lo spareggio non attribuisce punti. L’anteprima docente usa lo stesso criterio. I bonus nel tabellone e nell’inventario sono liste senza numeri né marcatori, con una voce per riga e quantità. I soli gruppi eliminati hanno una X rossa originale in SVG ispirata al riferimento 15044.jpg, senza sfondo e senza bloccare i comandi sottostanti; la dicitura ELIMINATO resta disponibile.

`python3 tests/display.py`: valore punti, assenza di metadati nella domanda nascosta, liste senza numerazione, eliminazione tramite sanzioni, X solo sul gruppo eliminato, apertura dei dettagli, persistenza dopo ricarica e inventario su 240×320, 390×844 e 1440×900; nessun errore JavaScript. `python3 tests/responsive.py`: flusso completo su dieci dimensioni fino a 2560×1440, tastiera, touch e testo ingrandito, senza overflow laterale. Screenshot mobile e desktop ispezionati. Motore, regole e formato dei salvataggi invariati.

## Preparazione rapida e Impostazioni — interfaccia 1.3.0

La home ha tre pulsanti: Start, Regole, Impostazioni. Start consente soltanto nomi e icone dei tre gruppi e argomento dal catalogo online; Inizia partita entra nella domanda nascosta senza anteprima. Timer, probabilità bonus, difficoltà, punti base e quote sono in Impostazioni, insieme all’anteprima docente facoltativa (estrazione di esempio). I parametri validati sono conservati per banca in `fool-settings-v1`, separati da `fool-v1`: aggiornare le impostazioni non cambia le partite già iniziate. Le sei icone monocromatiche compaiono nei gruppi e nel tabellone; il metadato opzionale è salvato nella configurazione e i vecchi salvataggi restano validi con icone predefinite. Formato, versione del motore e regolamento restano invariati.

Verifiche eseguite:
- `node tests/engine.test.js`: 28 prove superate, comprese validazione delle icone e compatibilità dei salvataggi precedenti.
- `python3 tests/settings.py`: menu, preparazione priva di parametri/soluzioni, persistenza, rifiuto di valori non validi, anteprima e ritorno, applicazione dei parametri, isolamento dalle partite, icone/ripresa, vecchi salvataggi e storage bloccato; 240×320, 390×844 e 1440×900.
- `python3 tests/responsive.py`: flusso completo su dieci dimensioni da 240×320 a 2560×1440, testo grande, nomi lunghi, formule, tastiera e touch. Adeguato il terzo pulsante anche agli schermi più stretti.
- `python3 tests/online.py`, `python3 tests/navigation.py` e `python3 tests/browser.py`: caricamento online, errore/riprova, rifornimento, home unica, timer, sanzioni, risposta, salvataggio/ripresa e navigazione delle regole.
- `python3 tests/layout.py`: tutte le 100 domande e 21 sezioni delle regole su dieci dimensioni, senza overflow laterale né errori JavaScript.

Le descrizioni seguenti sono lo storico delle versioni precedenti.

## Revisione colore del logo — interfaccia 1.2.2

Su richiesta del responsabile le superfici blu sono state portate a grigio antracite/nero, conservando lettering, metallo e accenti arancioni/dorati. La risorsa corrente è `assets/fool-logo.png`; il JPEG di riferimento resta conservato. Schermata iniziale, intestazioni del gioco e delle regole e icona usano la nuova risorsa. Verificati caricamento e proporzioni su desktop e mobile, con ispezione visiva del logo nel sito; nessuna modifica al motore o ai salvataggi.


## Correzione navigazione — interfaccia 1.2.1

Eliminata la schermata iniziale interna duplicata. «Torna alla schermata iniziale», anche dopo un errore di caricamento, naviga alla home ufficiale della cartella del sito. Aprire o ricaricare `Fool.html` mostra la configurazione e l'eventuale ripresa della partita salvata; non viene creata una schermata iniziale alternativa. Una nuova partita dal riepilogo torna alla configurazione. Anche le regole hanno un pulsante esplicito «Torna alla schermata iniziale», in tutte le sezioni. Il salvataggio resta invariato. `tests/navigation.py` verifica il percorso reale sotto prefisso di cartella su mobile e desktop.


## Aggiornamento: logo ufficiale, Doom 1993 e responsività, interfaccia 1.2.0

La home presenta il logo JPEG originale del responsabile, il sottotitolo esatto «Solo uno sciocco pensa di vincere» e due azioni sovrapposte, Start e Regole. Start entra direttamente nella configurazione. Sfondo pixel con cielo rosso/pietra generato dal riferimento, senza la scritta originaria; carattere VT323 ospitato sul sito con licenza OFL. Logo e stessa identità anche nelle pagine interne.

Il precedente blocco sotto 1280×800 è eliminato su richiesta del responsabile. Home, configurazione, quiz, esito, dialoghi e regole si ridispongono; contenuti lunghi scorrono verticalmente, formule troppo larghe nel proprio riquadro. Su mobile i dettagli dei gruppi sono espandibili. Non è nascosto contenuto per ottenere il fit. Le sezioni successive descrivono le verifiche storiche delle precedenti versioni e non reintroducono il vecchio vincolo.

Verifiche eseguite: 27 test del motore superati, senza modifiche alla logica di gioco. `tests/layout.py` verifica tutte le 100 domande e le 21 sezioni a 240×320, 280×653, 320×568, 390×844, 768×1024, 844×390, 1024×768, 1280×800, 1440×900 e 1920×1080, senza overflow orizzontale della pagina. Testi lunghi e resize a 800×600 restano utilizzabili, senza pausa automatica ingiustificata.

`tests/responsive.py` esercita menu, configurazione, anteprima, domanda, pausa, sanzione, dettagli, inventario, esito, sospensione/ripresa e indice delle regole a dieci dimensioni da 240×320 a 2560×1440. Comprende nomi lunghi, punteggi frazionari, formule larghe e testo portato a 24 px; inoltre tastiera sui due pulsanti della home ed emulazione touch in verticale e orizzontale. `tests/online.py` è aggiornato all'ingresso diretto Start e mantiene i controlli su caricamento automatico e assenza di download. Nessun errore JavaScript rilevato nelle prove eseguite. Screenshot desktop/mobile ispezionati per logo, sottotitolo, menu e tabellone.


## Aggiornamento: distribuzione solo online, interfaccia 1.1.0

Su nuova richiesta del responsabile, la versione corrente non propone download, caricamenti o esportazioni di file. La pagina iniziale apre gioco e regole; il gioco carica `datasets.json` e la banca selezionata dal sito. La partita si salva e riprende nello stesso browser, senza modifiche al motore o alle regole. La precedente consegna 1.0.0 è documentata nelle sezioni storiche successive; i requisiti di distribuzione offline sono superati dalla nuova richiesta.

Verifiche correnti: i 27 test motore restano superati. `tests/online.py` verifica il caricamento del catalogo e delle 100 domande sotto un prefisso di percorso come GitHub Pages, assenza di input file e link download, nessun evento download, salvataggio/ripresa con domanda identica e timer fermo, esaurimento senza ripetizioni o vittorie, rifornimento da un aggiornamento online e recupero dopo errore HTTP 503. I test browser e layout sono aggiornati al nuovo flusso. Le formule e i criteri di adattamento restano quelli già verificati.


App **1.0.0**, regolamento **18.0.1**, grafica **1.2.1**. Data: 21/10/2026.

## Piano e avanzamento

- [x] Lettura di README, prompt, regolamento, specifiche, grafica e dataset reali. Nessun AGENTS.md presente nell'albero GitHub.
- [x] Incremento eseguibile: validazione, configurazione, quote, anteprima, estrazione, timer, esito, punteggi e rotazione.
- [x] Sanzioni prioritarie, rifiuti, cinque bonus e interazioni, conclusione e spareggio.
- [x] Persistenza locale e file versionati, ripresa con timer fermo, banca condivisa e rifornimento.
- [x] Due HTML autonomi, presentazione navigabile, renderer formule incorporato e controlli di adattamento.
- [x] Prove motore e browser; archivio con hash identici; README e licenze.

Compatibilità delle formule storiche verificata con un test dedicato: si elimina soltanto al rendering il livello aggiuntivo di escape dei delimitatori e dei comandi, senza riscrivere i dataset. La scelta bonus incompleta è verificata anche nel salvataggio.

File principali: `Fool.html`, `Fool_regole.html`, `src/engine.js`, `src/app.js`, `src/style.css`, `src/slides.json`, `src/slides.js`, `tools/build.py`. Le risorse KaTeX sono in `vendor/`.

Rischi affrontati: doppi esiti e sorteggi, priorità disciplinare, conservazione delle quote frazionarie, bonus trasformati e vincolati, incompatibilità dei salvataggi e ingombro di formule/spiegazioni. Orologio e casualità sono iniettati nel motore. Punteggi e confronti usano frazioni ridotte con BigInt, serializzate come stringhe decimali.

## Verifiche eseguite

`node tests/engine.test.js`: **27 test superati**, con scenari multipli e casualità controllata, sui dati reali del repository.

| Scenari verificati | Riferimenti pertinenti |
| --- | --- |
| Dataset reale e template, BOM, normalizzazione, formule non valide, ID duplicati, testo HTML inerte, configurazioni errate | SPEC-04–09/13/14/38; ACC-01–04/23/53/58 |
| 33 turni validi, 11 per gruppo senza bonus, soluzione dopo mescolamento, esiti ripetuti respinti | SPEC-06–09/17–20; ACC-05/12/15/34/80 |
| Serie 100/110/120/130/140, reset senza perdita di punti, turni e salti | SPEC-19/20/35/38; ACC-06/07/36/56/65/66 |
| Pausa/residuo/scadenza, pannello sanzioni bloccante, nessuna ripartenza implicita | SPEC-17/32/39; ACC-26–28/59 |
| Terza sanzione durante risposta, domanda annullata e sostituita, intervento su più gruppi, zero/uno superstiti | SPEC-22/24/39; ACC-60/62/72/73 |
| Ruba punti simultanei e duplicati, 100/3 esatti, eliminazione selettiva e errore del bersaglio | SPEC-36/40; ACC-42/43/68/74–77 |
| Aura: attacchi nuovi/preesistenti, consumo offensivo, durata fino al turno, Karma non trasformato se bloccato | SPEC-42; ACC-85–87/91/94/95 |
| Karma multiplo, una trasformazione, tipo e autore, bersaglio illecito respinto senza consumi | SPEC-43; ACC-88–92/96/97 |
| Svela e passa: scelta ferma, stesso quesito, timer intero, rotazione dal destinatario, quota unica | SPEC-37; ACC-48–50/70/71/95 |
| Rifiuto dalla scelta, respinto senza timer, accettato con stessa serie/quota | SPEC-23/37; ACC-66/79 |
| Salti cumulati senza consumo di domanda o effetto Ruba punti | SPEC-20/36; ACC-67/69 |
| p=0, p=90, p=100; cinque rami di tipo separati e controllati, mancata vincita al 90% | SPEC-36; ACC-40/54/83/93 |
| Ripresa con frazioni, effetti, scelta, Aura e bonus usato; JSON incoerenti respinti | SPEC-30/40; ACC-18/19/44/55/81 |
| Campanella, esito prima della sospensione, ripresa senza nuovi premi o accrediti | SPEC-30; ACC-11/18/38 |
| Spareggio: stessi 60 secondi personalizzati, reset bonus, ordine persistente, errore eliminatorio; riserva esaurita e rifornimento | SPEC-31/34; ACC-16/20–25/31–33/51/52 |

Le righe collegano scenari realmente esercitati a criteri pertinenti; non attestano che ogni variante di ciascun ACC sia automatizzata. Le descrizioni dei 27 test nel sorgente specificano le asserzioni effettive.

`python3 tests/browser.py`: caricamento banca, configurazione/anteprima, svelamento e timer, pausa, sanzione, corretta/esito; indice e tastiera della presentazione. Nessun errore JavaScript e nessuna richiesta a servizi esterni.

`python3 tests/layout.py`: **100 domande × 3 dimensioni**, incluse soluzioni e spiegazioni; **21 sezioni × 3 dimensioni**, senza scorrimento. Dimensioni: 1280×800, 1440×900, 1920×1080 pixel CSS. Verificati anche testo eccessivo respinto, ridimensionamento a 800×600 con pausa, 200 copie bonus aggregate, import incompatibile che non sostituisce la partita e risposta/esito con rete disabilitata. I dialoghi usano i comandi nativi della tastiera e focus visibile.

Le prove browser hanno usato Chromium e un server HTTP temporaneo sulla sola macchina di test perché la policy gestita del browser blocca gli URL `file://`. Il prodotto non avvia né richiede un server. L'apertura diretta `file://` non è stata verificata in questo ambiente; è da confermare sul dispositivo del docente, come compatibilità Safari/Firefox e leggibilità sul proiettore reale. Nessun controllo statistico instabile è stato usato per i bonus.

## Copertura della presentazione

Ogni sezione contiene gli ID REG nel sorgente HTML e in `src/slides.json`; non li mostra agli studenti. La copertura unisce tutte le REG-01–30.

| Sezioni | Regole |
| --- | --- |
| 1–3: gruppi/materiali, giro, timer | REG-01–06/21/22/24 |
| 4–5: punteggi, serie ed errori | REG-07–09/15/19 |
| 6–7: disciplina ed eliminazioni | REG-10–14/16/23/24 |
| 8–11: inventario, salti e furti | REG-10/15/25–27 |
| 12–16: passaggio, Aura e Karma | REG-07/25/28–30 |
| 17–19: rifiuti, campanella, vittoria | REG-10/17–22/24 |
| 20–21: Battaglia finale e casi particolari | REG-10/17–20/23/24 |

Esempi presenti: 100/110/120; lordo 240 diviso 80/80/80 e terzi esatti; A passa a C e il successivo è A; Aura conserva i malus precedenti; una sola trasformazione Karma con autore vincolato. Le fonti sono dichiarate in entrambi i file.

## Integrità dell'archivio

Hash Git blob verificati sui byte recuperati, senza modifiche:

- `archivio/Chi_vuol_essere_rimandato_quiz_v3_20261008.html`: `19a3b7fef523641d44a822caef05607bb8f33c17`.
- `archivio/Chi_vuol_essere_rimandato_regole_v9_20261008.html`: `0a1b7c48cf5a0c6443daaaac13726287266a5a34`.

`PROVENIENZA.json`, ID, domande e schema dei dataset restano invariati. I documenti storici di analisi descrivono ancora la situazione prima di questo incremento: il presente resoconto distingue implementazione e risultati verificati. L'unica correzione nelle specifiche è il promemoria finale ormai superato su p: il regolamento stabilisce già il default al 90%.

## Limiti dichiarati

Non è una certificazione completa di tutte le combinazioni ACC-01–98 o di tutte le dimensioni/contenuti possibili. La matrice automatica usa il dataset di termologia presente; inventari trasformati complessi, nomi lunghi e più effetti vengono comunque ricontrollati dinamicamente prima di consentire una risposta. Un inventario numeroso si consulta anche nel pannello paginato. La grafica è provvisoria e le scelte finali restano al responsabile. Non sono stati cambiati regolamento, hosting o integrazioni con il registro.
