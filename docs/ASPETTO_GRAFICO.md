# Fool — Specifiche dell’aspetto grafico

Versione: **1.7.0** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

## 1. Scopo e fonti

Questo documento raccoglie le indicazioni grafiche approvate per **Fool**, per la home, il quiz e la presentazione delle regole. Le indicazioni correnti sostituiscono i precedenti dettagli lasciati aperti soltanto nelle aree esplicitamente definite dal responsabile. Il [regolamento](REGOLAMENTO_UFFICIALE.md) resta la fonte delle regole di gioco; le [specifiche del programma](SPECIFICHE_PROGRAMMA.md) ne descrivono il funzionamento.

## 2. Indicazioni approvate

| ID | Caratteristica | Indicazione |
| --- | --- | --- |
| VIS-01 | Nome del gioco | **Fool** |
| VIS-02 | Riferimento visivo | **Doom del 1993**, con estetica pixel |
| VIS-03 | Ambito | Identità coerente di home, quiz e presentazione delle regole |
| VIS-04 | Aggiornamenti | Raccogliere qui le indicazioni successive del responsabile |
| VIS-05 | Logo ufficiale | Prima immagine allegata nella richiesta del 21/10/2026, `15033.jpg`, conservata come riferimento in `assets/fool-logo.jpg`; revisione corrente grigio/nero in `assets/fool-logo.png` |
| VIS-06 | Sottotitolo della home | **Solo uno sciocco pensa di vincere** |
| VIS-07 | Menu della home | Tre riquadri cliccabili in colonna: **Start**, **Regole**, **Impostazioni** |
| VIS-08 | Sfondo | Richiamo alla seconda immagine, `15034.jpg`: cielo rosso e pavimento scuro di pietra, con estetica Doom 1993 |
| VIS-09 | Responsività | Il sito, il gioco e le regole si adattano a mobile e desktop, in entrambe le orientazioni, senza imporre la precedente finestra minima |

La revisione corrente porta le superfici blu a grigio antracite e nero, conservando forma e accenti arancioni/dorati. Il riferimento JPEG originale è conservato separatamente. L'inserimento nel sito usa un filtro SVG di visualizzazione che rende trasparente il fondo quasi nero, conservando i colori del marchio. Lo sfondo è una risorsa generata a partire dallo stile del riferimento, priva della scritta presente nel riferimento.

## 3. Home e navigazione

La home presenta il logo, il sottotitolo esatto e tre pulsanti in colonna: **Start**, **Regole**, **Impostazioni**. **Start** apre la preparazione breve: tre nomi e argomento della banca online. **Inizia partita** entra nella domanda nascosta senza mostrare le soluzioni. **Regole** apre la presentazione navigabile. **Impostazioni** (`Fool.html?settings=1`) raccoglie parametri, quote e anteprima docente; il salvataggio dei parametri è separato da quello della partita. Il logo nelle pagine interne riporta alla home.

L'aspetto dei riquadri usa bordi metallici squadrati, caratteri pixel e testo rosso. Sono scelte di implementazione coerenti con il riferimento; non introducono regole o funzioni aggiuntive. Il carattere VT323 è ospitato sul sito con la relativa licenza SIL OFL. Non sono stati aggiunti suoni; il feedback animato è descritto negli aggiornamenti successivi.

## 4. Adattamento e leggibilità

La richiesta di responsività su qualunque schermo supera il precedente requisito di finestra minima 1280×800 e il divieto assoluto di scorrimento di SPEC-33. Non si tagliano informazioni e non si rendono minuscoli i testi per mantenerli tutti in una schermata. I contenuti possono scorrere in verticale; formule particolarmente larghe hanno un proprio scorrimento orizzontale, utilizzabile anche da tastiera.

- Logo e immagini mantengono le proporzioni e si ridimensionano con la finestra.
- Alternative su due colonne dove c'è spazio e su una colonna sugli schermi stretti.
- Tabellone con punteggi, sanzioni e gruppo rispondente; Moltiplicatore, bonus ed effetti sempre visibili, senza icone, indicatore della serie o sezioni espandibili.
- Pannelli, dialoghi, anteprima, esito e navigazione delle regole si dispongono senza uscire lateralmente dalla pagina.
- Pulsanti principali con area tattile di almeno 44 pixel; focus visibile e navigazione da tastiera.
- Il solo ridimensionamento a una finestra piccola non blocca il gioco né ferma il timer. Rimane una protezione con pausa in caso di elemento realmente troppo largo e non gestibile dal layout.
- Nessuna modifica a domande, punteggi, serie, sanzioni, bonus, timer, salvataggi o Battaglia finale.

## 5. Dettagli ancora aperti

Logo, sottotitolo, menu, riferimento del 1993, sfondo e responsività sono approvati. Le icone dei gruppi sono state rimosse; le animazioni per corretta, bonus e aumento del moltiplicatore sono approvate. Suoni e altre variazioni restano da indicare dal responsabile. Le etichette devono continuare a rendere visibili Aura attiva, tipo e autore vincolato delle copie Karma, eliminazioni e sanzioni; gli stati non sono espressi soltanto tramite colore.

## 6. Risorse e verifiche

Provenienza e licenza delle risorse: [assets/README.md](../assets/README.md). Sorgenti: `src/home.html`, `src/style.css`, `src/logo-filter.svg` e `src/app.js`. Rigenerazione: `python3 tools/build.py`.

Le verifiche comprendono home e menu, tutte le 100 domande e le 21 sezioni delle regole su mobile e desktop, orientamento orizzontale, testi ingranditi, nomi lunghi, quote frazionarie, formule eccessivamente larghe, pannelli disciplinari, bonus, salvataggio e ripresa. Esiti effettivi in [VERIFICHE_IMPLEMENTAZIONE.md](VERIFICHE_IMPLEMENTAZIONE.md).

## 7. Revisioni

Percorsi stabili e cronologia Git conservano le edizioni precedenti.

| Versione | Data | Modifica |
| --- | --- | --- |
| 1.0.0 | 21/10/2026 | Nome Fool, direzione Doom e raccolta delle caratteristiche |
| 1.1.0–1.1.3 | 21/10/2026 | Estetica pixel e requisiti visivi di Aura e Karma |
| 1.2.0 | 21/10/2026 | Nome Fool, bonus e interazioni Aura/Karma |
| 1.2.1 | 21/10/2026 | Spareggio rinominato «Battaglia finale» |
| 1.3.0 | 21/10/2026 | Logo ufficiale, Doom 1993, sottotitolo, menu Start/Regole, sfondo dal riferimento e responsività mobile/desktop |
| 1.3.1 | 21/10/2026 | Superfici blu del logo sostituite da grigio/nero su richiesta del responsabile |

## 6. Indicazioni del 22/10/2026

Nel quiz il metadato della domanda mostra soltanto il valore in punti base configurati, senza livello di difficoltà o nome dell’argomento; nello spareggio il valore è zero perché non si attribuiscono punti. Il valore resta visibile anche dopo lo svelamento. Anche l’intestazione dell’anteprima docente usa i punti, lasciando argomenti e difficoltà nei soli parametri di Impostazioni.

I cinque bonus di ciascun gruppo sono elencati uno per riga, senza numeri o marcatori, con quantità visibile. Anche le copie nell’inventario sono in una lista senza numerazione. Quando il gruppo è eliminato, il suo riquadro riceve una X rossa a pennellate, ispirata al riferimento 15044.jpg; il disegno è un SVG originale su fondo trasparente. Il segno si adatta al riquadro e non intercetta clic o touch. La dicitura ELIMINATO rimane per l’accessibilità e la leggibilità dello stato.

## 7. Sanzioni e conclusione — aggiornamento del 22/10/2026

La X corrente è un PNG generato con canale alfa (`assets/eliminated-x.png`), applicato direttamente al riquadro senza intercettare i comandi. Il precedente SVG non è più usato.

Il pannello delle sanzioni usa pulsanti −/+ e un contatore di sola lettura. Si preparano le nuove sanzioni da 0 al numero necessario a raggiungere 3; un riepilogo indica il totale dopo conferma e l’eventuale eliminazione. Le modifiche pendenti e il motivo si conservano nel salvataggio, senza applicare sanzioni finché non si conferma. «Chiudi senza sanzionare» le annulla.

Quando resta un solo gruppo in gioco, la conclusione pulisce pausa, sospensione e pannelli residui; l’interfaccia chiude il dialogo, rimuove l’eventuale avviso di layout e porta il focus al titolo della vittoria. Il timer non è più mostrato e il riquadro del superstite indica VINCITORE.

## 8. Schermate finali — aggiornamento del 22/10/2026

La schermata di vittoria mostra soltanto il nome scelto dal gruppo e la scritta WINS. Se tutti sono eliminati, mostra soltanto GAME OVER. Le scritte sono PNG trasparenti nello stile a pennellate della X: WINS è giallo, GAME OVER rosso; si ridimensionano mantenendo le proporzioni. Un solo pulsante, sotto l’esito, riporta alla schermata iniziale ufficiale. Nome del gruppo a capo se lungo, testo alternativo per le immagini, titolo raggiungibile dal focus. Le schermate finali nascondono intestazione, tabellone, timer e comandi di gioco.

Tutti i riferimenti al premio sono rimossi dai finali e dal codice dell’interfaccia. Le informazioni rimangono nelle regole, senza modificarne il contenuto; una futura modifica del premio non richiederà di riscrivere la schermata dell’esito. La ripresa di una partita conclusa riapre lo stesso finale.

## 9. Tabellone e animazioni — aggiornamento del 22/10/2026

Rimossi i selettori delle icone dalla preparazione e le icone dal tabellone. Non è più mostrata la serie di risposte corrette: il contatore resta interno al motore. La precedente voce Prossima corretta si chiama **Moltiplicatore**, con valore evidenziato. Bonus ed effetti sono sempre espliciti nel riquadro, senza Dettagli o disclosure, anche su mobile. Sotto 350 px i riquadri si dispongono in colonna per mantenere leggibili nomi e bonus.

Una nuova risposta corretta evidenzia brevemente il riquadro e la conferma dell’esito; il bonus ottenuto e il moltiplicatore aumentato ricevono un’evidenziazione dedicata. Gli effetti sono brevi, non richiedono attese e non alterano punteggi, timer o estrazioni. Non si ripetono ridisegnando la pagina o riprendendo un salvataggio; con preferenza di sistema per movimento ridotto non vengono avviati. I vecchi salvataggi con icone restano caricabili, senza mostrarle.

## 10. Esiti pixel e colori — aggiornamento del 22/10/2026

Ogni nuova risposta mostra al centro dello schermo CORRETTO giallo oppure SBAGLIATO rosso, con carattere pixel VT323. Anche una scadenza mostra SBAGLIATO. Il messaggio scompare prima dell’evidenziazione del moltiplicatore e dell’eventuale bonus. Giallo per incremento e bonus ottenuto; rosso per un moltiplicatore perso. In quest’ultimo caso compare brevemente il precedente valore barrato, poi viene rimosso.

Il Moltiplicatore è espresso come 110%, 120%, ecc., e non compare al valore base (100%) né quando non applicabile. Le tonalità di giallo si schiariscono al crescere del valore. Anche il dettaglio del calcolo dei punti usa la percentuale del moltiplicatore applicato. Le quantità dei bonus sono scritte senza prefisso ×, nel tabellone e nell’inventario. Nome del vincitore e WINS sono gialli; GAME OVER e X di eliminazione restano rossi.

La sequenza è solo visiva, non blocca i comandi e non altera il modello. Un cambio di schermata annulla il feedback pendente; la ripresa non lo ripete. Con movimento ridotto il messaggio è statico e più breve, senza animazioni di bagliore; i colori e i testi restano disponibili.
