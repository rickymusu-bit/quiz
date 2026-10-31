# Audit e implementazione correzioni locali — v1.0.0

31 ottobre 2026, repository `rickymusu-bit/quiz`. Stato: proposta e codice locali, non caricati su GitHub. Fonte: prompt utente «Hellscape — Protocollo di correzione locale degli sprite con ImageGen». Nessuna modifica agli asset approvati o al runtime.

## Revisioni consultate prima dell'intervento

| Riferimento | Revisione verificata | Conseguenza |
| --- | --- | --- |
| main | `4876d1a066f31453e844a8932cb12d94529db2ae` | AGENTS.md rinvia alla v12; il Cerbero stabilizzato è approvato |
| PR #92, aperta | `96312a3bb56ebdcf9cb070327dd049f4c0c2a25d` | v13 già proposta con fisica/biomeccanica: nuova proposta v14 basata sul suo testo, senza approvazione implicita |
| PR #94, aperta | `e25dcfec976496e734db3152f754b132ed6cec83` | Estendere `sprite_postprocess.py`; non creare una seconda pipeline |
| PR #96, aperta | `495654f05b5a9f137200ffed76cfe5c06b6315a3` | Piano cattura asset e roadmap postprocessing: stessa CLI e ancoraggi; nessuna produzione dei veicoli in questo intervento |
| PR #93, aperta | `c43e2316c9dfe836eb0bce5c3ed5f890274ffb7f` | Riferimenti Cerbero esistenti, non rigenerati |
| PR #95, draft | `5ecc0dbecc7e7ae7ddf13320d38fc890c497f7a5` | Fiamme abbandonate dall'utente: nessun seguito, nessuna modifica alla PR |
| PR #90, draft | `94e631b68dca207bc21910cba71c74b2dd64440e` | Candidato demone volante: nessuna promozione o modifica |

Le funzionalità dell'editor e delle correzioni deterministiche sviluppate nei turni precedenti sono locali: non descriverle come già presenti in main o nella head remota della PR #94. Il workspace è una copia di lavoro senza `.git`; le revisioni sono state lette dal connettore GitHub. Non sono stati effettuati commit, upload, aggiornamenti di PR o merge.

## Confronto con il prompt

| Richiesta | Stato prima | Intervento |
| --- | --- | --- |
| Classificare deterministico / locale / keyframe / prospettiva | Indicazioni sparse nel protocollo e nel piano #96 | Tabella normativa §7.7 e diagnosi annotata eseguibile con `--patch-diagnose`; blocco esportazioni generative per errori deterministici |
| Allineamento, maschere, pivot, pennelli, clone, onion, ricette | Già implementati localmente | Riutilizzati, senza duplicare il motore |
| Originale immutato, maschera distinta dal crop, riferimenti e prompt | Tracciabilità generale presente; mancava un pacchetto locale completo | Snapshot/hash, maschera frame/crop, contesto, PNG originale, riferimenti approvati e vicini, prompt esatto e modelli di handoff |
| Una modifica semantica, connessioni e invarianti | Regole generali di retake | Campi obbligatori nella richiesta e protocollo esplicito; la correttezza del contenuto richiede supervisione |
| Importazione manuale senza presumere API | Non presente | `--patch-import`; log degli input effettivi e della provenienza, dimensioni verificate, nessuna chiamata di generazione |
| Landmark e reinserimento solo nella maschera | Trasformazioni deterministiche di parti, ma nessun candidato esterno | Registrazione esplicita + operazione `patch` nella ricetta condivisa; snapshot precedente obbligatorio |
| RGBA esterno esatto, alpha e sfumatura | Non coperto per import esterni | Sostituzione RGBA, sfumatura interna premoltiplicata, confronto di tutti i byte anche sotto alpha zero |
| Verifica vicini / loop / scala / anatomia | Onion, landmark e GIF locali esistenti | Prima/dopo, diagnostica della stessa pipeline, checklist umana completa e report tecnico distinto |
| Tracciabilità e riproduzione | Manifest del normale export | Fascicoli sigillati, candidato/finale/matrici/report, replay con confronto byte e versione Pillow/hash implementazione |
| Stato approvazione e rigetto | Candidati genericamente «da revisionare» | Revisioni append-only con revisore, note, evidenze e checklist; rigetto riparte dallo snapshot |
| Protocollo versionato, coordinamento PR | Main v12, proposta v13 aperta | Proposta v14 include integralmente il §2.2 della v13; AGENTS conserva v12 vincolante e segnala la proposta |

## Limiti intenzionali

La preparazione e l'importazione del fascicolo usano la CLI esistente; il progetto risultante si carica nell'editor browser esistente, dove si confronta, disattiva e riesporta il livello mascherato. Non è stato aggiunto un generatore online o un servizio di hosting. L'editor locale richiede Python/Pillow in esecuzione.

Non è stato richiesto un difetto concreto da correggere generativamente. La prova usa un candidato **sintetico di calibrazione**, dichiarato come tale, che altera volutamente tutto il contesto: il reinserimento deve limitarlo alla maschera. Non è un nuovo asset approvato, né un risultato ImageGen. Non sono stati eseguiti test del gioco o verifiche artistiche alla scala finale; le GIF sono diagnostiche o catture reali dell'editor, non registrazioni runtime di Hellscape.

L'approvazione tramite JSON registra dichiarazioni ed evidenze del revisore; non le sostituisce con un giudizio automatico. I controlli dei pixel non certificano anatomia o assenza di aloni. Le versioni v12/v13 non vengono cancellate o rinominate: il coordinamento delle PR dovrà risolvere il rimando vincolante senza perdere regole. Nessun merge automatico.

## Verifiche e artefatti locali

- `PYTHONPATH=/tmp/sprite-pillow113 python -m unittest discover -s tests -p 'test_sprite*.py' -q`: 56 test, inclusa la CLI completa prepare/import/replay, traslazione/rotazione su landmark, crop fuori copertura, dimensioni errate, snapshot cambiato, maschere e RGBA, sfumatura, portabilità e replay byte per byte.
- `tests/sprite_editor_browser.py`: 9 controlli browser del flusso di allineamento.
- `tests/sprite_local_edits_browser.py`: 9 controlli browser di maschere, pivot e correzioni deterministiche.
- `tests/sprite_patches_browser.py`: 6 controlli browser di caricamento patch, confronto attiva/disattiva, animazione, export, assenza di richieste esterne/errori e sorgente invariata.
- Chromium reale, viewport 1460×980; cattura nuova del flusso importato in `artifacts/sprite-editor/patch-review/browser-demo.gif`, durata 4080 ms; stato statico `browser.png`. Candidato sintetico esplicitamente indicato nel rapporto.
- 21 file del fascicolo approvato `run-stabilized-v1` confrontati con i blob della tree main `611c63ecc1babfc64603f2927b61a836688f3d88`: tutti identici. I file runtime non sono stati toccati.

La CI locale proposta estende il workflow del tool a moduli, unit test e prova browser. Nessuna esecuzione CI remota è implicita; Python 3.10/3.12 della matrice verranno verificati su GitHub dopo un eventuale caricamento autorizzato. La verifica locale è su Python 3.12 con Pillow 11.3.0.

Guida: [Correzioni locali v1](SPRITE_LOCAL_PATCHES_v1.0.0_20261031.md). Protocollo: [proposta v14](PROTOCOLLO_SPRITE_ANIMATI_v14.0.0_20261031.md).
