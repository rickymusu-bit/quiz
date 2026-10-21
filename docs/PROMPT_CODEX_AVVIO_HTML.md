# Fool — Template per avviare l’implementazione con Codex

Versione: **1.2.0** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

Incollare in Codex il blocco seguente, lavorando nel repository `rickymusu-bit/quiz`. I percorsi sono relativi alla radice del repository. Questo template avvia la realizzazione del programma; non è il programma già implementato.

```text
Realizza da zero nel repository corrente due HTML autonomi per Fool:
- Fool.html: programma del quiz;
- Fool_regole.html: documento delle regole da spiegare e proiettare in classe.
Completa l’implementazione e le verifiche: non fermarti a una proposta o a un
mockup. Procedi per incrementi funzionanti, mantenendo una lista di avanzamento.

FONTI DA LEGGERE PRIMA DI MODIFICARE
1. Le istruzioni AGENTS.md applicabili, se presenti, e README.md.
2. docs/REGOLAMENTO_UFFICIALE.md: fonte normativa delle regole.
3. docs/SPECIFICHE_PROGRAMMA.md: comportamento, stato, dataset, salvataggi,
   priorità e criteri di accettazione.
4. docs/ASPETTO_GRAFICO.md: requisiti visivi approvati e scelte ancora aperte.
5. Template_dataset_quiz_argomenti_v1_20261008.json e il dataset ordinario
   presente nel repository, per verificare la compatibilità effettiva.

Leggi le versioni correnti, senza assumere che quelle citate in vecchie chat
siano ancora valide. Questo prompt orienta il lavoro, non sostituisce le fonti.
In caso di conflitto prevale il regolamento; segnala e correggi le incoerenze
nelle specifiche senza inventare nuove regole. Chiedi un chiarimento soltanto
se una contraddizione reale impedisce di proseguire su quella parte; continua
intanto il lavoro indipendente. Le scelte tecniche reversibili spettano a te.

AMBITO E CONSEGNA
- Crea Fool.html e Fool_regole.html nella radice. Sposta i due vecchi HTML
  in archivio/ conservandone contenuto e nomi; aggiorna i link attivi e annota
  il nuovo percorso senza riscrivere gli hash storici di PROVENIENZA.json.
  Sono consultabili per recuperare risorse o studiare il parser, non come
  fonte autorevole delle regole. Non distribuire i vecchi HTML come attuali.
- Il nuovo HTML deve aprirsi direttamente nel browser e funzionare offline,
  senza installazione, server, account, CDN o richieste di rete necessarie.
- Il docente carica un dataset JSON esterno. Incorpora nell’HTML le risorse
  indispensabili, comprese quelle per le formule. Conserva licenze e avvisi
  delle risorse riutilizzate. Non inglobare necessariamente la banca domande.
- Puoi mantenere sorgenti modulari e strumenti di sviluppo nel repository,
  purché il risultato distribuibile sia un unico HTML autonomo e sia chiaro
  come rigenerarlo. Evita dipendenze non necessarie.
- Dichiara versione dell’app e del regolamento applicato; usa Fool in tutti
  i titoli visibili e bonus per gli oggetti di gioco. Il premio finale resta
  il 10 blu sul registro. Lo spareggio si chiama Battaglia finale.
- Realizza anche il nuovo documento delle regole. Non pubblicare un sito
  e non alterare configurazioni di hosting. Aggiorna README e istruzioni
  per aprire entrambi gli HTML e distinguere archivio e materiali attuali.

DOCUMENTO DELLE REGOLE PER LA CLASSE
- Fool_regole.html deve essere leggibile in proiezione e navigabile per
  sezioni con indice, pulsanti precedente/successiva e tastiera. Suddividi
  i contenuti in schermate brevi, senza un’unica pagina densa di testo.
- Usa italiano rivolto agli studenti e la stessa identità visiva del gioco,
  con testo grande, esempi concreti e tutte le risorse necessarie incorporate.
- Parti da squadre/materiali, scopo e premio finale; spiega turno e timer,
  punteggi/difficoltà/serie, errori, sanzioni, bonus e loro interazioni,
  rifiuti, campanella e ripresa, vittoria anticipata, pareggio e spareggio.
- Copri tutte le REG correnti; i dettagli meno frequenti possono stare in
  sezioni di approfondimento raggiungibili dall’indice. Non ometterli né
  mostrare identificativi SPEC/ACC, checklist tecniche o note di sviluppo
  agli studenti. Riporta versione e data del regolamento in modo discreto.
- Mostra i valori predefiniti come tali, non come valori obbligatori quando
  configurabili. Spiega il 10 blu e il contributo al voto verde annuale.
- Includi esempi di serie 100/110/120, divisione Ruba punti fra tre gruppi,
  Svela e passa e rotazione, Aura contro nuovi attacchi e Karma vincolato.
- Distingui gli errori ordinari dallo spareggio eliminatorio; distingui il
  reset della serie dalla perdita di punti, che le sanzioni non causano.
- Non copiare i testi delle vecchie regole. Mantieni un collegamento fra
  ogni sezione e le REG trattate nel sorgente o in un documento di verifica.
- Mantieni i valori condivisi e la versione coerenti nei due file tramite
  sorgenti/generazione comuni se opportuno, senza dipendenza di rete né
  necessità di aprire un HTML per far funzionare l’altro.

STRUTTURA E INTEGRITÀ
- Separa modello di partita, transizioni degli eventi, estrazione casuale,
  timer, persistenza e rendering, anche se confluiscono nello stesso HTML.
- Una sola fonte di stato: niente regole ricavate dal testo o dai colori DOM.
- Rendi testabili orologio e casualità. Proteggi gli eventi da doppi invii,
  doppio clic, scadenza concorrente, ridisegno e ripresa del salvataggio.
- Applica la priorità disciplinare prima degli esiti ancora pendenti.
- Mantieni punteggi razionali esatti e confronti esatti, anche con terzi;
  eventuali valori arrotondati servono soltanto alla visualizzazione.
- Valida dataset e salvataggi prima di sostituire lo stato attivo; conserva
  gli ID già svelati, gli esiti casuali e le provenienze degli effetti.
- Gestisci il contenuto del dataset come testo/formule, senza eseguire HTML
  o script caricati dall’utente. Non mostrare le soluzioni nell’interfaccia
  ordinaria prima della registrazione della risposta.

CONTROLLI CONTRO LE VECCHIE REGOLE
Questi promemoria non sostituiscono le condizioni complete dei documenti:
- Tre gruppi, 33 domande valide, rotazione fissa, nessun passaggio libero.
- Tempo unico predefinito 45 secondi, personalizzabile; Pausa/Riprendi e
  apertura pannello sanzioni che sospende senza ripartenza automatica.
- Basi predefinite facile 100, media 200, difficile 300, configurabili;
  moltiplicatore dalla seconda corretta, +10% per ogni elemento successivo
  della serie, senza tetto. Errore/scadenza ordinari: zero punti, reset serie.
- Sanzioni separate dai punti: reset serie a ogni sanzione, eliminazione
  alla terza, anche durante una domanda; controlla uno o zero superstiti.
- Bonus accumulabili, una sola attivazione per turno, finestre e quote
  rispettate anche con passaggi e sostituzioni. p predefinita 90%, modificabile
  0–100%; cinque tipi equiprobabili condizionati alla vincita.
- Implementa integralmente Salta turno, Ruba punti simultanei a parti uguali,
  Svela e passa, Aura e Karma secondo SPEC-36/37/42/43. Nessun inventario finto.
- Aura facoltativa nel proprio turno: blocca solo nuovi malus, incluso il
  passaggio ricevuto, fino all’inizio del prossimo turno; l’attacco bloccato
  consuma comunque copia e quota. Non cancella malus pendenti o sanzioni.
- Un malus applicato trasforma una sola copia Karma; il bonus ottenuto resta
  vincolato al suo autore. Trasformazione passiva distinta dall’attivazione.
- Svela e passa mostra la domanda senza timer; la scelta avvia il tempo
  intero. Rotazione successiva dal rispondente effettivo, senza nuova quota.
- Rifiuto accettato: nuova domanda allo stesso gruppo, senza consumo di
  domanda valida o reset serie. Domande svelate e annullate non si riusano.
- Campanella: conclude la domanda già svelata, poi sospende e salva per la
  lezione successiva, salvo priorità disciplinare o fine partita.
- Spareggio tra primi a pari merito: domande extra inutilizzate dalla stessa
  banca a quattro alternative, stesso tempo normale, ordine iniziale casuale,
  errore/scadenza eliminatori. Inventari ed effetti cancellati; nessun bonus.
- Vincitori: 10 blu fisso indipendente dal punteggio; nessuna integrazione
  automatica con il registro elettronico.

INTERFACCIA
- Nome Fool, riferimento Doom classico ed estetica pixel. Il logo ufficiale
  è il wordmark FOOL metallico blu e oro approvato il 21/10/2026, descritto
  in docs/ASPETTO_GRAFICO.md. Usa assets/fool-logo.png dopo aver verificato
  che il file originale sia stato caricato; non inventare un altro logo e
  non fingere che il file esista. Mostralo nella schermata iniziale e nella
  copertina delle regole, preservandone proporzioni e leggibilità. Incorpora
  l’asset nei due HTML offline. In assenza del file segnala il blocco e usa
  temporaneamente il titolo FOOL in testo, senza sostituire la scelta.
  Palette e font ulteriori sono ancora aperti; non inventare suoni.
- Copri tutte le schermate previste: avvio, configurazione, anteprima docente,
  turno/domanda nascosta, scelta passaggio, risposta, esito, bonus/bersagli,
  pausa/sanzioni, salvataggio/ripresa, spareggio e riepilogo finale.
- Tutte le informazioni operative devono rientrare in larghezza e altezza
  senza scorrimento alle dimensioni dichiarate supportate. Non ottenere il
  risultato tagliando informazioni o rendendo minuscoli testo e formule.
  Applica SPEC-33 quando contenuti o ridimensionamento impediscono il fit.
- Verifica testi italiani, formule lunghe, inventari numerosi, nomi lunghi,
  punteggi frazionari e stati contemporanei. Usa focus visibile e comandi
  accessibili da tastiera; comunica gli stati anche con testo oltre al colore.

ORDINE DI LAVORO
1. Dopo la lettura, scrivi un piano breve con file previsti, copertura delle
   SPEC/ACC e rischi concreti. Inizia subito a implementarlo.
2. Primo incremento eseguibile: caricamento/validazione, configurazione,
   anteprima, estrazione, turno, domanda e timer con pausa, esito/punteggio,
   rotazione. Non presentarlo come gioco completo se manca il resto.
3. Completa sanzioni, bonus e loro interazioni, rifiuti, condizioni finali,
   spareggio e salvataggio/ripresa. Mantieni sempre consistente il modello.
4. Realizza Fool_regole.html; verifica copertura delle regole, esempi,
   navigazione e leggibilità in proiezione. Integra e verifica il layout
   operativo del gioco e l’autonomia offline di entrambi gli HTML.
5. Esegui controlli del motore e prove browser significative; correggi gli
   errori prima della consegna. Aggiorna la tracciabilità SPEC/ACC.

VERIFICHE E RESOCONTO
- Usa i criteri ACC correnti come specifiche di scenario: non sono test già
  eseguiti. Automatizza i casi di logica sensibili e fai prove browser per
  layout, formule, tastiera, timer e uso offline. Non basta un controllo sintassi.
- Includi doppi eventi, sanzione durante risposta, più Ruba punti con terzi,
  Aura su attacchi nuovi/preesistenti, Karma multipli e bersaglio vincolato,
  Svela e passa e rotazione, ripresa senza nuove estrazioni, esaurimento banca,
  vittoria anticipata e spareggio. Prova p=0, p=90 e p=100 con casualità controllata.
- Verifica che i vecchi HTML archiviati siano rimasti identici e che i dataset ordinari
  funzionino senza riscriverne domande, ID o schema per comodità del codice.
- Nel resoconto finale indica file creati, come aprire entrambi gli HTML, versione,
  verifiche realmente eseguite e limiti residui. Non dichiarare completato
  ciò che è soltanto pianificato; segnala i controlli non eseguibili.
```

## Revisioni

| Versione | Data | Modifica |
| --- | --- | --- |
| 1.0.0 | 21/10/2026 | Prompt iniziale per il nuovo HTML autonomo, con fonti autorevoli, incrementi, requisiti offline e verifiche |
| 1.1.0 | 21/10/2026 | Due consegne: programma e regole per la classe; vecchi HTML da archiviare con aggiornamento dei riferimenti |
| 1.1.1 | 21/10/2026 | Spareggio rinominato «Battaglia finale»; meccaniche invariate |
| 1.2.0 | 21/10/2026 | Inserito logo FOOL ufficiale, con asset esterno in attesa del caricamento e istruzioni offline |
