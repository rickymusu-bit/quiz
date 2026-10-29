# HELLSCAPE — Specifica modifiche Omen, Cerbero e layout

**Versione:** v1  
**Data:** 29 ottobre 2026  
**Destinatario:** Codex / sviluppatore del repository Hellscape  
**Stato:** specifica di implementazione; sprite Arsenico e Cerbero ancora da progettare e approvare.

## Obiettivo

Aggiornare nomenclatura e meccaniche degli Omen, preparare l'adozione del nuovo antagonista a tre teste e rendere l'intera schermata di gioco utilizzabile senza scorrimento verticale. Conservare le caratteristiche già approvate che non sono espressamente modificate qui.

## 1. Nomenclatura: «Ammo» → «Omen»

- Sostituire tutte le etichette visibili «ammo» con «omen» in HUD, inventario, schermate, istruzioni e notifiche.
- Adeguare nomi interni e test solo dove utile, evitando migrazioni distruttive dei salvataggi: gli inventari salvati devono continuare a caricarsi.
- Usare «Omen» anche per plurale e singolare nell'interfaccia, salvo eventuale revisione linguistica successiva.

## 2. Modifiche alle meccaniche

### Catene

- Nuovo effetto: il giocatore che usa Catene **paga l'11% del proprio punteggio corrente** e designa un avversario che **salterà il suo prossimo turno**.
- Il costo è sostenuto dal giocatore che usa l'Omen, anche se il bersaglio ha pochi punti.
- Evitare costi negativi e punteggi sotto zero. Applicare la convenzione di arrotondamento del progetto ai punti, rendendola uniforme e coperta da test.
- Nell'interfaccia mostrare costo ed effetto prima della conferma.

### Antisigillo

- Rimuovere Antisigillo dal catalogo degli Omen ottenibili, dai menu e dalle logiche attive.
- Gestire i salvataggi precedenti contenenti Antisigillo senza crash: rimuovere o migrare in sicurezza gli esemplari già nell'inventario, senza attribuire Omen alternativi arbitrariamente.

### Sigillo e Livella

- **Sigillo non protegge dall'effetto di Livella.**
- Conservare le altre protezioni di Sigillo, se già previste, senza modificarle in questa attività.
- Coprire esplicitamente con test il caso di giocatore protetto da Sigillo e colpito da Livella.

### Nuovo Omen: Arsenico

- Attivazione: il giocatore sceglie un avversario come bersaglio e **sacrifica un proprio turno**.
- Effetto sul bersaglio: perde **l'11% del suo punteggio corrente in ciascuno dei suoi successivi 3 turni**. È una sottrazione composta, NON un 11% complessivo diluito nei 3 turni.
- Applicare ogni riduzione una sola volta al turno del bersaglio, secondo una fase del turno univoca e documentata. Non consumare accidentalmente una delle 3 applicazioni a causa di refresh, animazioni, ripristini o doppi eventi.
- Formula di riferimento, senza altri cambiamenti di punti: `P_n = P_(n-1) × 0,89` per `n = 1, 2, 3`; quindi `P_3 ≈ 0,705 × P_0`, perdita complessiva ≈ 29,5%.
- Non permettere punteggi negativi; utilizzare lo stesso arrotondamento dei punti per tutti gli Omen e registrare con precisione la convenzione adottata.
- Rendere visibile nel pannello del bersaglio lo stato «Arsenico: 3/2/1 turni rimanenti» e il decremento applicato; l'effetto deve sopravvivere al salvataggio e al ripristino della partita.
- Non assegnare un asset definitivo: usare temporaneamente un segnaposto visivo coerente, da sostituire **dopo l'approvazione dello sprite Arsenico**.

**Interpretazioni operative da rendere coerenti col motore esistente:** il turno sacrificato è quello in cui si attiva Arsenico, senza sommare un secondo salto; l'applicazione della penalità avviene nei tre turni del bersaglio, anche se quel turno viene saltato per un altro effetto. Se il flusso attuale del gioco non consente questa semantica, isolare il punto e segnalarlo nella PR prima di cambiare regole di gioco. Specificare in test cosa succede se l'effetto viene riapplicato allo stesso bersaglio; non introdurre stacking arbitrario senza approvazione.

## 3. Nuovo demone: Cerbero junkpunk horror

- Sostituire in prospettiva l'antagonista attuale con un **Cerbero a tre teste**, dall'estetica **junkpunk horror** coerente con Hellscape: creatura terrificante, silhouette leggibile, componenti di rottame e metallo integrati nell'anatomia, niente stile fantasy-cartoon.
- Prima di sostituire gli asset o riscrivere le animazioni, produrre proposte di sprite e screenshot REALI nel contesto del gioco per approvazione.
- Il Cerbero dovrà supportare le animazioni esistenti: inseguimento continuo e fluido, accelerazione, cattura/divoramento dei perdenti e reazione finale. Evitare teste tagliate, scatti, clipping e incoerenza di scala/risoluzione.
- **Non generare o integrare automaticamente lo sprite definitivo in questa PR**: la progettazione grafica è una fase separata.

## 4. Layout: HUD in alto, nessuno scrolling

- Riportare le **tre finestre dei giocatori nella parte superiore** della schermata di gioco, come nella disposizione precedente.
- Tutti i controlli e gli elementi essenziali del gameplay devono restare visibili in **un'unica viewport**, senza scroll verticale né orizzontale, tanto su desktop quanto su smartphone.
- Preservare le regole esistenti: finestre impilate e collassabili, giocatore corrente in cima, evidenziazione gialla del giocatore corrente, punteggio sempre visibile; da aperte mostrano vite e inventario; sovrapposizione consentita.
- Riordinare e ridimensionare con approccio responsive gli elementi anziché ridurre indiscriminatamente la leggibilità. Prevedere verifica su schermi piccoli e landscape/portrait; i contenuti interattivi devono rimanere utilizzabili.
- Le scorciatoie da tastiera restano attive **solo in modalità desktop**.

## 5. Affidabilità, qualità e compatibilità

1. Ispezionare prima il codice reale, la struttura degli Omen, lo schema dei salvataggi e i test già presenti; adattare la specifica senza riscrivere parti non coinvolte.
2. Implementare gli Omen con un motore di effetti consistente: gestione dei turni, prevenzione di doppi trigger, costo, bersaglio, scadenza e ripristino.
3. Aggiungere test automatici per: Catene (costo e salto turno); scomparsa Antisigillo; Sigillo non blocca Livella; Arsenico (tre riduzioni composte, turni saltati, salvataggio/ripristino, arrotondamenti, soglia zero); viewport senza overflow.
4. Eseguire le verifiche/CI disponibili; non introdurre regressioni su domande, pareggi, spareggi, salvataggi, punteggi o Omen esistenti.
5. Applicare il refactoring proporzionato alle modifiche secondo `AGENTS.md`, senza intervenire su funzionalità non richieste.
6. Preparare una PR dedicata, con riepilogo dei cambiamenti, decisioni implementative e risultati dei test; **non fare merge automatico**.

## 6. Anteprime obbligatorie

- Fornire **soltanto screenshot reali** del risultato per la revisione visiva, senza HTML embedded o file HTML presentati come anteprima.
- Screenshots almeno per: HUD completo desktop; HUD mobile con tutti gli elementi nella viewport; Arsenico attivo sul bersaglio; inventario con nuova nomenclatura.
- La nuova grafica di Arsenico e Cerbero sarà progettata e approvata in una **seconda fase**, prima dell'integrazione definitiva nel gioco.

## Criteri di accettazione

- Il gioco non mostra più «Ammo» o Antisigillo.
- Catene costa l'11% dei punti correnti dell'utilizzatore e fa saltare il prossimo turno al bersaglio.
- Sigillo non neutralizza Livella.
- Arsenico riduce dell'11% il punteggio corrente del bersaglio per 3 suoi turni, cumulativamente, consumando un turno dell'utilizzatore; il countdown sopravvive ai salvataggi.
- Nessuna parte essenziale dell'interfaccia richiede scrolling durante il gameplay nelle viewport testate.
- La PR non presume che gli sprite definitivi di Arsenico e Cerbero siano già approvati.
