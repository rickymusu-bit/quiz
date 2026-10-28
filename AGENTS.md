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
- L’utente ha richiesto una GIF della schermata di gioco con il nuovo ponte: è autorizzata l’integrazione del ponte per questa verifica nel browser. Presentare la GIF reale e attendere il riscontro sulla strada prima di riprendere le modifiche successive.

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
