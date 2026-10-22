# Fool

Quiz online di Riccardo Musumarra. **Interfaccia 1.6.0**, regolamento **18.0.1**.

Apri **https://rickymusu-bit.github.io/quiz/** e scegli **Start**, **Regole** o **Impostazioni**. Non sono previsti download, installazioni o selettori di file.

## Domande già sul sito

Il gioco legge il catalogo `datasets.json` e carica automaticamente la banca selezionata dal sito. È disponibile Termologia, con 100 domande. Con **Start** si scelgono soltanto i nomi dei tre gruppi e l’argomento dal catalogo, poi **Inizia partita** avvia il gioco con domanda nascosta. **Impostazioni**, sotto Regole nella home, raccoglie tempo, punti base, probabilità bonus, difficoltà e quote dei sottoargomenti: totale 33. **Salva impostazioni** conserva un profilo per ogni banca in `localStorage` (`fool-settings-v1`) per le nuove partite nello stesso browser. Da Impostazioni si può aprire l’anteprima docente con le soluzioni, da usare prima della proiezione.

Il catalogo contiene `versione: 1` e l'elenco `banche`, ciascuna con `id`, `nome` e `url` relativa al sito. Per aggiungere una banca, pubblicare il relativo contenuto nello schema esistente e aggiungerla al catalogo. Le domande mantengono il contratto del dataset e i loro ID originali. Il catalogo e le banche devono provenire dallo stesso sito; errori di rete o validazione bloccano l'avvio e offrono **Riprova**.

All'esaurimento della riserva, **Cerca nuove domande** verifica gli aggiornamenti delle banche online. Inserisce soltanto nuovi ID compatibili con gli argomenti e la difficoltà della partita; non ripropone le domande già note, non sovrascrive quesiti modificati e non assegna una vittoria perché mancano domande.

## Salvataggio nello stesso browser

La partita viene salvata automaticamente nel browser. **Salva nel browser** permette un salvataggio esplicito; **Riprendi partita** nella preparazione recupera l'ultima partita conservata da quel browser, mantenendo il timer fermo fino al comando del docente. Non sono presenti importazione o esportazione di file. Le partite non sono sincronizzate tra dispositivi e la cancellazione dei dati del sito elimina il salvataggio locale.

Alla campanella una domanda già svelata deve essere conclusa; solo dopo l'esito si sospende. Sanzioni prioritarie, serie, inventari e bonus vincolati, rifiuti, rotazione e Battaglia finale restano quelli del regolamento 18.0.1.

La nuova richiesta del responsabile di offrire il quiz solo online sostituisce i precedenti requisiti di distribuzione offline e scambio di file. Il motore e il formato di salvataggio restano compatibili con 1.0.0: le partite già conservate nello stesso browser vengono riprese senza modificare le regole.

## Logo e interfaccia responsive

La sola home è `https://rickymusu-bit.github.io/quiz/`: «Torna alla schermata iniziale» e il logo riportano a questo indirizzo. `Fool.html` apre direttamente la configurazione, senza una schermata iniziale alternativa.

La home usa il logo ufficiale rivisto su richiesta del responsabile, con superfici grigio/nero al posto del blu, il sottotitolo **Solo uno sciocco pensa di vincere** e tre pulsanti sovrapposti: **Start**, **Regole**, **Impostazioni**. Lo sfondo riprende cielo rosso e pavimento di pietra del riferimento, nell'estetica di Doom del 1993. Immagini e caratteri sono serviti dal sito stesso; provenienza e licenze sono in [assets/README.md](assets/README.md).

Home, configurazione, gioco, dialoghi e regole si adattano alla larghezza disponibile, senza una finestra minima obbligatoria. Su mobile le alternative diventano una colonna mentre bonus ed effetti restano visibili e il Moltiplicatore compare in percentuale solo quando attivo in ogni riquadro, senza menu Dettagli. Se serve, la pagina scorre in verticale; le formule molto larghe possono scorrere nel proprio riquadro, senza tagliarle o rimpicciolirle. Restano disponibili focus visibile, tastiera e comandi touch. Un ridimensionamento normale non sospende il timer; solo un effettivo problema di larghezza non gestita attiva la protezione del layout.

La matrice browser comprende schermi da 240×320 a 2560×1440, orientamento orizzontale, emulazione touch e caratteri ingranditi. Queste sono le dimensioni provate, non una limitazione imposta al sito. Dettagli delle prove in [VERIFICHE_IMPLEMENTAZIONE.md](docs/VERIFICHE_IMPLEMENTAZIONE.md).

I finali mostrano solo il nome del gruppo con **WINS**, oppure **GAME OVER** se tutti sono eliminati, e il pulsante per tornare alla schermata iniziale. Le scritte a pennellate sono PNG trasparenti: WINS giallo, GAME OVER rosso; i dettagli del premio restano esclusivamente nelle regole.

Per ogni risposta compare un grande esito pixel: **CORRETTO** giallo oppure **SBAGLIATO** rosso. Dopo la scomparsa si evidenziano bonus e variazione del moltiplicatore. Le percentuali attive (110%, 120%, …) usano gialli sempre più chiari; il valore base non viene mostrato. Le quantità dei bonus non hanno il prefisso ×.

## Fonti e verifiche

- [Regolamento ufficiale](docs/REGOLAMENTO_UFFICIALE.md), autorità normativa.
- [Specifiche del programma](docs/SPECIFICHE_PROGRAMMA.md).
- [Aspetto grafico](docs/ASPETTO_GRAFICO.md).
- [Istruzioni originali di implementazione](docs/PROMPT_CODEX_AVVIO_HTML.md), antecedenti alla richiesta di distribuzione solo online.
- [Avanzamento, tracciabilità e verifiche realmente eseguite](docs/VERIFICHE_IMPLEMENTAZIONE.md).
- [Prompt per generare dataset](Prompt_generazione_dataset_quiz_v2_20261021.txt).

I due HTML storici sono conservati **identici**, con i nomi originali, in [archivio/](archivio/). Non sono il programma o le regole attuali. [PROVENIENZA.json](PROVENIENZA.json) conserva i percorsi e gli hash originari del trasferimento da `rickymusu-bit/fisica`: non sono stati riscritti per l'archiviazione.

## Sorgenti e rigenerazione

Il motore, separato dal DOM, è in `src/engine.js`; interfaccia, stile e regole proiettate sono in `src/`. Il renderer KaTeX 0.16.22 e i font incorporati provengono dal vecchio HTML; l'avviso MIT è conservato in `vendor/LICENSE-KaTeX.txt` e nelle pagine del sito.

```sh
python3 tools/build.py
node tests/engine.test.js
python3 tests/browser.py
python3 tests/layout.py
python3 tests/online.py
python3 tests/responsive.py
python3 tests/settings.py
python3 tests/navigation.py
python3 tests/display.py
python3 tests/sanctions.py
python3 tests/endings.py
python3 tests/scoreboard.py
```

La rigenerazione usa soltanto la libreria standard Python. I test motore usano Node; i test browser richiedono Python Playwright e Chromium (`/usr/bin/chromium`). Il sito generato è statico e viene pubblicato sul ramo `gh-pages`. `src/home.html` genera la pagina iniziale; `src/app.js` gestisce il caricamento online e i salvataggi nel browser.
