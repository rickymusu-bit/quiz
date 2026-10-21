# Fool — solo online

Sito: https://rickymusu-bit.github.io/quiz/

Interfaccia 1.2.2, regolamento 18.0.1. GitHub Pages pubblica il ramo `gh-pages`, cartella `/`.

Il sito offre il quiz e le regole direttamente nel browser. Non sono presenti pulsanti di download, selettori di file o importazione/esportazione delle partite. Le domande vengono caricate automaticamente dal catalogo `datasets.json` e dalle banche pubblicate sul sito. Il dataset rimane una risorsa interna del sito, senza collegamenti di download per l'utente.

La partita si conserva automaticamente nello stesso browser. Non viene sincronizzata su altri dispositivi; cancellare i dati del sito elimina il salvataggio locale. Il motore e le regole sono invariati.

I sorgenti e le istruzioni per rigenerare le pagine sono nel ramo `codex/fool-offline-18-0-1` e nella pull request #1. Il nome storico del ramo non descrive la distribuzione corrente, che è solo online.

## Identità e schermi

Home con logo ufficiale fornito dal responsabile, sottotitolo «Solo uno sciocco pensa di vincere» e menu verticale Start/Regole. Sfondo pixel con cielo rosso e pavimento di pietra, ispirato a Doom del 1993. Start apre direttamente la configurazione.

Home, gioco, dialoghi e regole si adattano alla larghezza della finestra, senza il precedente blocco minimo 1280×800. Su mobile i dettagli dei gruppi sono espandibili; testo e comandi possono scorrere verticalmente. Formule molto larghe scorrono nel loro riquadro. Sono stati verificati desktop, telefono, orientamento orizzontale, touch, tastiera e testi ingranditi.

Logo, sfondo e carattere sono in `assets/`, con provenienza in `assets/README.md` e licenza del carattere in `assets/vt323-license.txt`.

La home unica è `/quiz/`: «Torna alla schermata iniziale» e il logo riportano a quell’indirizzo. `Fool.html` apre la configurazione e permette la ripresa, senza una copertina interna duplicata.

Anche nelle regole è presente un pulsante esplicito «Torna alla schermata iniziale».

Il logo corrente è `assets/fool-logo.png`: le superfici blu sono ora grigio antracite/nero, con accenti arancioni e dorati conservati.
