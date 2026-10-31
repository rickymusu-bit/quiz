# Regole trasversali per agenti e contributori

**Ambito:** disposizioni generali per documentazione, codice, asset, verifiche e consegna. Le istruzioni relative a uno specifico gioco, personaggio, effetto, livello o regola di punteggio risiedono nelle rispettive specifiche e non diventano norme generali.

## Gerarchia delle fonti e documenti di progetto

- Questo file definisce **come lavorare** nel repository; non sostituisce le specifiche del prodotto.
- Per i dettagli di Hellscape consultare [Specifiche di progetto e casi degli asset — v1.0.0](docs/HELLSCAPE_PROJECT_RULES_v1.0.0_20261031.md) e le specifiche di singole funzionalità, incluse le loro revisioni più recenti.
- Per la progettazione e la correzione delle animazioni consultare [Protocollo operativo per sprite animati coerenti — v14.0.0](docs/PROTOCOLLO_SPRITE_ANIMATI_v14.0.0_20261031.md). Evitare duplicazioni delle sue norme in questo file.
- Applicare prima i vincoli condivisi; per identità, palette, movimenti, risoluzioni, tempistiche e interazioni verificare gli asset canonici e i documenti specifici. Tra specifiche in conflitto prevale l'ultima disposizione esplicitamente approvata, dopo verifica della provenienza.
- **Distinzione obbligatoria:** una spiegazione o un esempio non vale come nuova istruzione di progetto. Non trasformare valori, GIF, personaggi o screenshot di un esempio in requisiti per altri asset.

## Evidenze e anteprime

- Per modifiche dinamiche a prodotti interattivi, fornire una **registrazione reale** della stessa revisione eseguita nel browser, quando la modifica è verificabile lì: GIF animata o altro formato esplicitamente richiesto, con schermata, viewport, durata e revisione. Non usare una simulazione o una GIF derivata da PNG come prova del runtime.
- Per stati statici consegnare screenshot reali e aggiornati; per animazioni uno screenshot isolato non mostra la continuità del movimento.
- Non incorporare HTML eseguibile come anteprima, né allegare pagine HTML autonome soltanto per simulare una verifica. Un URL al sito di prova è separato dall'evidenza.
- Verificare gli stati significativi, comprese varianti desktop/mobile dove pertinenti. Non dichiarare ispezioni o test non eseguiti.
- Se un intervento produce solo documentazione o asset candidati non integrati, dichiararlo e non fabbricare evidenze di runtime.
- Se il lavoro è richiesto per fasi, consegnare un intervento giudicabile per volta, senza accorpare le fasi successive.

## Approvazioni, versionamento e tracciabilità

- Non fare merge, sostituire asset approvati o pubblicare modifiche senza l'approvazione esplicita richiesta. Prima del merge controllare CI applicabile e SHA effettivo della head.
- Tenere `main` come unico branch permanente; usare branch temporanei e PR per le lavorazioni, eliminando il branch dopo merge verificato. Non cancellare branch con PR aperte o contenuti non integrati.
- Per documenti di lavoro nuovi usare `TITOLO_vMAJOR.MINOR.PATCH_YYYYMMDD.md`, con versione, data, fonte e registro delle variazioni. Conservare normalmente ultima e penultima revisione utile, senza perdere specifiche vincolanti, originali approvati o informazioni di provenienza.
- Conservare input canonici, prompt espliciti realmente usati, output, hash e decisioni pertinenti. Evitare di inventare dettagli non esposti dal generatore o di ricostruire a posteriori prompt come se fossero originali.
- Screenshot, GIF e log temporanei vanno di norma in `artifacts/` se configurata come cartella ignorata. Versionare solo prove canoniche necessarie e tracciabili; non riutilizzare materiale storico come prova di una verifica nuova.

## Test e controllo qualità

- Le modifiche funzionali devono mantenere la copertura di regressione appropriata, inclusi i percorsi critici del prodotto. È ammessa la suddivisione della suite in shard, non l'omissione dei controlli pertinenti.
- Per modifiche esclusivamente documentali è ammessa una verifica mirata quando l'impatto è certo; in caso di dubbio eseguire l'insieme completo dei test appropriati.
- Usare i comandi di CI documentati dal progetto; non inserire qui nomi di test di una funzionalità specifica.
- I controlli automatici integrano, ma non sostituiscono, la valutazione visiva e funzionale degli asset e delle animazioni.
- Non introdurre regressioni in comportamento, stato persistito, accessibilità, prestazioni, compatibilità o qualità grafica senza richiesta esplicita.

## Refactoring e manutenzione

Le presenti regole valgono per qualsiasi agente o operatore, compresi ChatGPT Work, Codex e interventi manuali, indipendentemente dallo strumento usato.

- Dopo una modifica valutare il debito tecnico introdotto e rimuovere duplicazioni e codice morto **solo dopo** aver verificato dipendenze e riferimenti.
- Effettuare refactoring strutturale quando duplicazione, accoppiamento e complessità lo rendono opportuno; non basarlo sul numero grezzo di commit.
- Separare responsabilità diverse quando riduce effettivamente il carico di manutenzione, senza frammentare il progetto in astrazioni inutili.
- Preservare comportamento, formato dati e vincoli approvati; distinguere refactoring da modifica funzionale. Se significativo, usare una PR dedicata.
- Prima di aggiungere una regola a questo file cercare quella già equivalente, non creare eccezioni locali e rimandi incoerenti.
