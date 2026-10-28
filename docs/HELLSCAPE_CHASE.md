# Inseguimento e catture — PR C

Terza fase della specifica cinematografica 1.2.0. Il motore, le regole e i
salvataggi conservano il loro formato e comportamento.

## Regia

Il finale prende le posizioni e le dimensioni dell'ultimo fotogramma di gara,
compresa la telecamera. In 1,1 secondi i mezzi rimasti si distanziano e convergono
sulla traccia centrale ricavata dalla geometria del ponte. Il vincitore guida;
i perdenti conservano l'ordine dal più arretrato. Gli attori già divorati non
vengono ricreati: restano possibili zero, una o due catture.

Ogni cattura dura 5,2 secondi: avvicinamento, contatto, presa, sollevamento,
trasporto alla bocca, inghiottimento e recupero. Gli ancoraggi sono ricavati
dalle pose dell'atlante esistente, senza modificarne risoluzione o qualità.
Il veicolo conserva la scala: segue la mano e poi le fauci, con un'occlusione
locale della mano e una clip sulla linea della bocca. Scompare integralmente
solo dopo averla attraversata. I mezzi superstiti avanzano alla cattura seguente.

Lo spostamento sullo schermo e quello della strada formano la distanza nel
mondo. La strada rallenta con continuità; durante il sollevamento i piedi
restano piantati rispetto al ponte. Alla ripresa la distanza determina cadenza
e impatti, senza invertire il movimento. Le catture ordinarie condividono la
stessa regia ma conservano le corsie degli altri mezzi e restituiscono alla
corsa la fase esatta della strada.

Dopo l'ultima cattura, 1,8 secondi di accelerazione portano il demone a un
piccolo intervallo dal vincitore, che prosegue verso il portale. Questo
intervento raccorda il portale e la reazione già esistenti: architettura
monumentale, rottura del ponte e nuovo ordine dell'epilogo appartengono alla PR D.

**Pausa scena** e **P** fermano il finale e le catture; durante lo spareggio
restano i controlli della PR B. Ridisegni, orientamento e pagina nascosta
conservano il progresso. Il movimento ridotto mostra subito il risultato
statico. La conclusione invia una sola notifica alla UI e non risolve di nuovo
la partita.

## Responsabilità e verifica

- `hell-chase.js`: piano e campionamento puro delle traiettorie di mondo,
  telecamera, ancoraggi e visibilità, senza DOM, timer o scritture al motore.
- `hell-ending.js`: estrazione delle pose, composizione e occlusioni Canvas;
  usa le traiettorie invece di duplicare le posizioni degli attori.
- `hell-race.js`: clock condiviso, ultimo fotogramma, coda effimera delle
  catture, integrazione con Ammo/spareggio, pausa e consegna alla corsa.
- `hell-motion.js`: locomozione per distanza e storico limitato degli impatti.

`npm run test:chase` verifica traiettorie e continuità a 30/60/144 FPS e il vero
HTML autonomo senza rete. Il browser riproduce i tre filmati con zero, uno o
due perdenti, confronta lo stato autorevole prima/dopo, controlla ancoraggi,
assenza di ricomparse, pausa, tastiera e orientamento. Campiona quattro fasi
in cinque viewport a DPR 1/2; include finali con movimento ridotto.
Screenshot, GIF e misure sono in `artifacts/chase/`. Per una verifica breve:
build `--quality-preview` e `python3 tests/chase_browser.py --quick`.

Il pannello dell'HTML di revisione offre **Inseguimento: 2 perdenti**,
**Inseguimento: 1 perdente**, **Inseguimento: solo vincitore** e i fotogrammi
**fila**, **presa**, **bocca**. Sono scenari dell'anteprima, nelle sole chiavi
offline; non aggiungono comandi alla partita pubblicata.
