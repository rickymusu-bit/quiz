# Fool

Sito: https://rickymusu-bit.github.io/quiz/

**Applicazione 2.0.0 · Motore 2.0.0 · Regolamento 19.0.0 · 25/10/2026**

Fool è un quiz di fisica per tre gruppi, pubblicato su GitHub Pages dal ramo `main`. Il gioco carica automaticamente i quesiti dal catalogo `datasets.json`. Le domande appartengono a banche separate, associate a materie e argomenti; non è richiesto un server applicativo.

## Partita ordinaria

Il docente configura gruppi, tempo, punteggi, difficoltà, argomenti e numero di domande (multiplo di tre da 3 a 99, predefinito 33). Una risposta corretta assegna i **punti base della difficoltà**, senza moltiplicatori o serie; una risposta errata non sottrae punti. I punti possono essere condivisi dal bonus Tasse. L'ordine dei gruppi è sorteggiato e poi fisso.

I cinque bonus, ciascuno con probabilità indipendente e predefinita del 30%, sono **Nope, Tasse, Spoiler, Aura, Karma**. Tasse mantiene la precedente logica di divisione del guadagno fra il rispondente e i beneficiari; l'identificativo interno `ruba` resta invariato per compatibilità. L'assegnazione di più bonus per singola risposta corretta è consentita.

Alla fine delle domande previste **vince il gruppo attivo con più punti**. Se resta un solo gruppo attivo prima della fine, vince immediatamente; se tutti vengono eliminati, è Game Over.

## Spareggio a eliminazione

Lo spareggio si apre **solo in caso di parità al primo posto**. I gruppi in testa rispondono una domanda ciascuno nell'ordine di rotazione originario. Ogni risposta errata o tempo scaduto elimina il gruppo. Il giro termina **solo dopo che tutti i gruppi ancora presenti nel giro hanno risposto**, anche quando il primo viene eliminato. Alla fine del giro, un solo superstite vince; nessun superstite produce Game Over; più superstiti iniziano un nuovo giro.

Le domande dello spareggio sono estratte fra **tutte quelle nuove del dataset**, senza vincoli di difficoltà, mantenendo il tempo della partita. Non si ripetono quesiti già mostrati; se la banca non basta, la partita attende l'aggiunta di nuovi quesiti. Durante lo spareggio non si assegnano punti né bonus; si disattivano gli effetti dei bonus ordinari. Sanzioni, rifiuti motivati, timer e sospensione restano disponibili.

## Interfaccia e salvataggi

La home, la schermata di gioco e le regole sono responsive per desktop, tablet e smartphone. Il comando per il fullscreen mostra **Schermo intero** o **Esci da schermo intero** in funzione dello stato del browser, anche quando il gioco è aperto in un iframe dalla home.

La partita viene salvata automaticamente in `localStorage` nello stesso browser. Le partite precedenti in fase ordinaria (motore 1.2.0 / regole 18.2.0) possono essere riprese conservando punteggi e domande, senza moltiplicatori futuri. I vecchi spareggi del Massacro non vengono convertiti, perché hanno regole incompatibili.

## Contenuto e verifiche

- `Fool.html`: interfaccia e motore incorporato.
- `Fool_regole.html`: regolamento proiettabile in classe.
- `dataset/`, `datasets.json`: banche pubblicate e catalogo.
- `docs/PROMPT_GENERAZIONE_DOMANDE.md`: istruzioni per creare quesiti.
- `tests/engine.test.js`: test del motore, del nuovo spareggio e delle estrazioni.
- `tests/configurable.py`, `tests/options.py`, `tests/keyboard.py`, `tests/start.py`: test di interfaccia (richiedono Playwright/Chromium per la modalità browser).
- `tests/verify_datasets.py`: controlli di conformità delle banche.

Eseguire `node --test tests/engine.test.js` e `python3 tests/verify_datasets.py` per i test senza browser.
