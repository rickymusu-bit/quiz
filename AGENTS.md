# Regole di consegna

## Anteprime: GIF per le modifiche dinamiche, screenshot per gli stati statici

Aggiornamento del 28/10/2026: per le modifiche dinamiche questa regola sostituisce la precedente preferenza «solo screenshot». Resta esclusa la consegna di HTML come anteprima.

Per ogni modifica visiva o funzionale a Hellscape/Fool:

- Per animazioni, movimento, transizioni ed effetti dinamici, allegare e mostrare direttamente una **GIF animata reale acquisita dal browser**, dalla stessa revisione del codice proposta, con indicazione di schermata, viewport e durata. La GIF deve permettere di giudicare movimento, continuità, ordine degli eventi e risultato finale; uno screenshot singolo non basta.
- Per gli stati statici usare screenshot reali e aggiornati. Gli screenshot possono integrare una GIF, ma non sostituirla quando la modifica è dinamica.
- **Non incorporare file HTML, iframe o anteprime HTML eseguibili nella risposta. Non allegare HTML autonomi come modalità di anteprima.**
- Se serve provare il gioco, si può fornire separatamente il collegamento al sito pubblicato o all'ambiente di test; l'anteprima richiesta resta la GIF o lo screenshot pertinente.
- Documentare le schermate fondamentali e, quando pertinenti, stati alternativi e proporzioni desktop/mobile. Non sostituire screenshot reali con mockup o immagini generate.
- Non dichiarare completata una verifica visuale senza avere realmente acquisito la GIF o gli screenshot pertinenti. Non spacciare immagini generate o animazioni illustrative per registrazioni del gioco. In caso di impedimenti, descrivere cosa non è stato possibile verificare.
- Quando l'utente chiede di procedere una cosa per volta, consegnare un singolo intervento completo e giudicabile per volta, con la relativa anteprima, senza accorpare le modifiche successive.
- Non eseguire merge senza approvazione esplicita.

Applicare la preferenza «GIF per la dinamica, screenshot per gli stati statici, nessun HTML embedded» anche agli altri siti e alle altre interfacce sviluppati per l'utente.

## Direzione grafica e fase di approvazione del ponte

- La coerenza fisica della scena prevale sulla leggibilità costante dei veicoli. Strutture in primo piano possono occluderli: rispettare profondità, prospettiva, ombre, materiali e punti d’appoggio, senza spostare o abbassare gli elementi soltanto per lasciare visibili i mezzi.
- Ripartire dal progetto della strada: un ponte di metallo e pietra neri sopra un mare di lava, in stile junkpunk, gotico e horror. Le colonne decorative proposte sono scartate.
- Il ponte della seconda GIF è approvato dall’utente: preservare lava e struttura nello stesso riferimento di camera e i veicoli ingranditi al doppio. È autorizzata la prosecuzione delle altre modifiche, una consegna per volta: portale, poi icona/animazione Antisigillo, poi Sacrificio.
- L’animazione del portale è approvata. Il suo sprite deve essere disegnato nativamente di taglio, con spessore e prospettiva coerenti: non deformare una facciata frontale per simulare la vista laterale. Posizionare lo sprite con traslazione e scala uniforme, preservando i tempi della sequenza.
- Il portale di taglio con dettagli dorati e crollo in rocce è approvato («Ok bellissimo. Vai avanti»). La successiva richiesta autorizza la consegna delle regole Ammo: Antisigillo 20%; Sacrificio 5%, −1 vita e +777 punti; Tributo trasferisce il 33% esatto dei punti attuali dell’avversario e chi lo usa rinuncia subito al turno corrente (chiarimento esplicito dell’utente).
- I dettagli del portale restano dorati: verificare che l’esportazione GIF non li sposti verso l’arancione della lava. Il crollo produce rocce e blocchi di pietra volumetrici, con gravità, piccoli rimbalzi e macerie permanenti; non fogli o ritagli piatti della facciata.

## Regola aggiornata di Malocchio

- La consegna di Sacrificio, Tributo e probabilità è approvata («Ok va bene»). Malocchio ora mostra testo e valore senza alternative; chi risponde bene tiene punti e Ammo, chi sbaglia o lascia scadere il tempo perde il valore della domanda con minimo zero (chiarimento esplicito). La rotazione riparte da chi segue l’utilizzatore, anche dopo il passaggio a un altro gruppo, rispettando Catene ed eliminazioni. Salvare autore e rischio della domanda senza riapplicare esiti già registrati.

## Regola aggiornata di Sigillo

- Sigillo protegge dagli effetti negativi delle Ammo altrui, ma blocca ogni altro uso di Ammo e la loro acquisizione da risposte corrette. Flagello ignora la protezione; Antisigillo la distrugge e rimuove subito anche le restrizioni.
- Interpretazione operativa comunicata: tre turni personali, incluso quello di attivazione; contatore 3 → 2 → 1, scadenza all’inizio del quarto. Livella esclude il protetto, lasciandone invariati i punti. Sigillo rimuove Catene e Tributi pendenti e non evita sanzioni o rischi autoimposti.

## Regola aggiornata di Contrappasso

- Contrappasso è attivabile su di sé per tre turni personali, incluso quello di attivazione. Raddoppia i punti delle risposte corrette e sottrae il doppio del valore in caso di errore o timeout, con minimo zero. Non trasforma più le Ammo avversarie, non si accumula e non raddoppia i premi Ammo o i punti di altre Ammo.
- Con Malocchio conta il Contrappasso del rispondente: penalità complessiva ×2, senza sommare un ulteriore ×1. Un Sigillo successivo non annulla un rischio proprio già attivato. Preservare contatori e copie storiche nei salvataggi senza applicare bonus retroattivi.

## Refactoring e manutenzione del progetto

Queste istruzioni si applicano a **qualsiasi agente o strumento** che modifichi il repository, inclusi ChatGPT Work, Codex e interventi manuali assistiti. Non dipendono dall'ambiente di sviluppo.

- Dopo ogni modifica, valutare il debito tecnico introdotto e ripulire localmente il codice interessato, senza cambiare il comportamento richiesto.
- Dopo modifiche architetturali importanti o quando emergono duplicazioni, accoppiamento eccessivo o complessità significativa, effettuare un refactoring strutturale dei moduli coinvolti.
- Avviare una revisione complessiva solo quando la struttura del progetto lo richiede: non utilizzare il semplice numero di modifiche come soglia automatica.
- Separare responsabilità distinte (stato del gioco, turni, punteggi, ammo, UI, rendering, animazioni, persistenza) dove ciò riduce realmente la complessità. Evitare astrazioni e frammentazioni inutili.
- Eliminare codice morto, duplicazioni, CSS e asset obsoleti, verificando prima che non siano ancora referenziati.
- Preservare invariati regole di gioco, interfaccia, qualità e risoluzione degli asset, prestazioni e compatibilità delle partite salvate, salvo richiesta esplicita contraria.
- Verificare il risultato con test pertinenti, inclusi test di regressione per calcolo punteggi, ammo, turnazione, spareggio, persistenza e caricamento degli asset. Non dichiarare eseguiti test che non sono stati realmente eseguiti.
- Se il refactoring è significativo, preferire una PR dedicata, distinta da nuove funzionalità, con sintesi delle modifiche e dei controlli effettuati.
- Per le modifiche visive o funzionali restano obbligatorie GIF reali o screenshot secondo la sezione precedente, senza HTML di anteprima.
- Prima di modificare AGENTS.md, verificare che la regola non esista già ed evitare duplicazioni o istruzioni contraddittorie.
