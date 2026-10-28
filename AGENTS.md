# Regole di consegna

## Anteprime: solo screenshot

Aggiornamento del 28/10/2026: questa regola sostituisce le precedenti richieste di file HTML incorporati o scaricabili come anteprima.

Per ogni modifica visiva o funzionale a Hellscape/Fool:

- Mostrare direttamente nella risposta screenshot reali e aggiornati del risultato, acquisiti dalla stessa revisione del codice proposta, con indicazione della schermata e del viewport.
- **Non incorporare file HTML, iframe o anteprime HTML eseguibili nella risposta. Non allegare HTML autonomi come modalità di anteprima.**
- Se serve provare il gioco, si può fornire separatamente il collegamento al sito pubblicato o all'ambiente di test, ma l'anteprima richiesta resta composta **solo da screenshot**.
- Documentare le schermate fondamentali e, quando pertinenti, stati alternativi e proporzioni desktop/mobile. Non sostituire screenshot reali con mockup o immagini generate.
- Non dichiarare completata una verifica visuale senza avere realmente acquisito gli screenshot. In caso di impedimenti, descrivere cosa non è stato possibile verificare.
- Non eseguire merge senza approvazione esplicita.

Applicare la preferenza «solo screenshot, nessun HTML embedded» anche agli altri siti e alle altre interfacce sviluppati per l'utente.

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
- Per le modifiche visive o funzionali restano obbligatori gli screenshot reali secondo la sezione precedente, senza HTML di anteprima.
- Prima di modificare AGENTS.md, verificare che la regola non esista già ed evitare duplicazioni o istruzioni contraddittorie.
