# Hellscape — Test della suddivisione ricorsiva del diavolo volante

**Data:** 29 ottobre 2026  
**Versione del rapporto:** v1  
**Protocollo:** [PROTOCOLLO_SPRITE_ANIMATI_v6_20261029.md](PROTOCOLLO_SPRITE_ANIMATI_v6_20261029.md)  
**Stato:** prototipo **non approvato**; nessuna integrazione nel gioco.

## Obiettivo
Verificare la proposta: due estremi (ali alte/ali basse), generazione iterativa delle pose intermedie, inverso dei medesimi frame per la risalita e timing non uniforme. Separare verifiche misurabili da qualità artistica.

## Cosa è stato effettivamente eseguito
Generata una tavola multiposa con 16 figure del diavolo, estratti 16 PNG RGBA. Le prime 8 pose sono state riprodotte in avanti e le 6 interne in ordine inverso, senza duplicare gli estremi, formando un loop tecnico di **14 fotogrammi** per **1660 ms**, con durate non uniformi. Prodotta inoltre un'anteprima illustrativa di **512 × 384 pixel logici**, con figura di ingombro massimo di circa **48 pixel**. **Non è una cattura del browser né il fondo reale di Hellscape.**

## Verifiche
| Controllo | Esito |
| --- | --- |
| Numero di immagini e canale alfa | 16 PNG RGBA: verificato |
| Loop inverso riutilizzando gli stessi PNG | Funziona come meccanismo tecnico |
| Timing non uniforme | Funziona come meccanismo tecnico |
| Integrità dei crop | **Non superata**: 11/16 celle toccano almeno un bordo, possibile troncamento |
| Sovrapposizione IoU delle sagome consecutive | Minimo **0,151**, media **0,609**; indicatore di revisione influenzato dall'allineamento delle celle, **non** diagnosi anatomica |
| Completa escursione ali alzate → ali abbassate | **Non superata**: la posizione inferiore generata è approssimativamente orizzontale e non chiaramente sotto le spalle |
| Generazione di una nuova posa centrale da due estremi approvati | **Non verificata**: il generatore ha restituito una tavola multiposa, anziché un vero nuovo intermedio autonomo |
| GIF reale del gioco | Non eseguita: asset non integrato |

## Decisione
**Test tecnico parziale riuscito; test complessivo NON SUPERATO.** Non dichiarare conforme lo spritesheet né pubblicarlo. Per testare davvero la ricorsione occorre: (1) produrre la singola posa B con entrambe le ali pienamente abbassate e approvarla, (2) produrre un singolo M rispetto ad A e B senza mesh/warp, (3) misurare continuità e coerenza dei landmark, (4) generare soltanto gli intermedi necessari, (5) ricreare GIF e verifica nel gioco. Se la generazione delle pose non soddisfa i vincoli, correggerle con editor di sprite.

**Artefatti locali:** `Hellscape_Diavolo_Test_Adattivo_v2.zip` contiene i 16 PNG estratti, la GIF ping-pong, la simulazione di scala, i metadati e il rapporto dettagliato. Questo rapporto GitHub non attesta che gli asset locali siano stati caricati nel repository.

Nessun merge prima dell'approvazione esplicita.
