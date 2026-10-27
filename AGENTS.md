# Regole di consegna

## Screenshot e anteprima scaricabile

Regola richiesta da Riccardo Musumarra il 26/10/2026.

Per ogni modifica visiva o funzionale a Hellscape/Fool e alle relative anteprime:

- Mostrare sempre almeno uno screenshot aggiornato del risultato direttamente nella risposta finale; non limitarsi a descriverlo o a dire che è stato verificato.
- Fornire sempre un collegamento per scaricare e provare l’anteprima della stessa versione mostrata nello screenshot, prima della richiesta di approvazione o merge.
- Preferire un unico file HTML autonomo, utilizzabile anche offline su Android, con asset e dati incorporati. Se non è possibile, fornire un pacchetto completo e istruzioni minime per aprirlo.
- Generare screenshot e anteprima dalla stessa revisione e verificare che l’anteprima si apra e funzioni.
- Non dichiarare completata la consegna se manca uno dei due elementi. Se un impedimento reale ne blocca uno, spiegarlo esplicitamente.

Applicare lo stesso criterio di consegna agli altri siti e alle altre interfacce sviluppate per l’utente.

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
- Per le modifiche visive o funzionali restano obbligatori screenshot e anteprima scaricabile secondo la sezione precedente.
- Prima di modificare AGENTS.md, verificare che la regola non esista già ed evitare duplicazioni o istruzioni contraddittorie.
