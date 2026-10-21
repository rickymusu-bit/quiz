# Fool — implementazione e verifiche

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
