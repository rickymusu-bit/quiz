# Correzioni locali degli sprite — v1.0.0

31 ottobre 2026. Proposta locale, pipeline `sprite_postprocess` v1.3.0; nessun upload, merge, modifica ad asset approvati o runtime. Integra il tool della PR #94 e l'editor locale v1.1. La proposta di protocollo v14 include la v13 ancora aperta nella PR #92: main resta alla v12 fino alla pubblicazione della revisione approvata.

## Cosa esisteva e cosa cambia

Esistevano estrazione, registrazione globale su landmark, onion skin, loop e atlas; nell'editor locale erano già presenti maschere poligonali, trasformazioni di parti con pivot, paint/erase/clone, ricette, undo/redo e export ripetibile. Non viene creata una seconda pipeline.

Questa revisione aggiunge classificazione dei difetti, fascicolo immutabile per correzioni esterne, crop distinto dalla maschera, importazione PNG con landmark espliciti, sostituzione RGBA mascherata, sfumatura interna, verifica pixel fuori maschera, replay e revisioni umane tracciate. **Non chiama ImageGen**. Il PNG esterno può arrivare da un servizio o da un artista; registrarne la provenienza reale. Le fixture dei test simulano quel passaggio e non sono generazioni ImageGen.

## Come funziona

1. Si diagnostica il difetto. Posizione, scala, colori, alpha e parti rigide vengono indirizzati al postprocessing; un difetto locale di disegno può richiedere ImageGen. Posa impossibile e prospettiva generale richiedono interventi più ampi.
2. Il tool congela sorgente, progetto e frame prima dell'intervento. Esporta la maschera binaria e un crop di contesto più largo, insieme a originale, riferimenti e vicini. Il prompt è esattamente quello scritto dall'operatore, senza generazione automatica o invio implicito.
3. Si inviano manualmente i materiali al servizio e si salva il PNG ottenuto. Si registra il prompt effettivamente usato e quali input sono stati forniti. Se cambia il prompt, creare una nuova richiesta: il fascicolo è sigillato con hash.
4. Il tool registra il crop per mezzo di landmark annotati, poi sostituisce i quattro canali esclusivamente dentro la maschera. Anche un candidato che cambia tutto il contesto non può alterare la regione esterna. L'alpha zero può cancellare dettagli dentro maschera; il blending premoltiplicato limita bordi scuri durante la sfumatura.
5. L'operazione entra nella ricetta dell'editor. Fuori maschera il frame **nativo**, prima dell'allineamento globale, deve conservare esattamente RGBA, incluso il colore sotto alpha zero. Il normale allineamento dell'atlante è separato e tracciato.
6. Prima/dopo, onion skin e GIF aiutano la revisione. Il tool non certifica anatomia, assenza di aloni o qualità del loop. L'approvazione richiede controlli espliciti, revisore ed evidenze; non autorizza integrazione o merge.

## Uso nello stesso tool

Richiede Python 3.10+ e Pillow, preferibilmente la versione di `requirements-test.txt` (11.3.0). Il replay esatto controlla la versione Pillow e gli hash dei moduli Python: conservare la revisione del tool registrata nel manifest. L'editor si apre nel browser, ma il server Python deve essere in esecuzione. **Questa prima integrazione prepara e importa i fascicoli da CLI**; nell'editor si carica il progetto risultante con «Apri progetto». Non occorre installare un generatore né fornire chiavi API.

Esempio con sorgente già esistente e progetto salvato dall'editor:

```sh
python scripts/sprite_postprocess.py SOURCE.png --columns 4 --rows 2 \
  --landmarks project.json --out artifacts/patch-work --patch-prepare request.json
```

`request.json` (coordinate native del foglio sorgente, frame da 1; i percorsi dei riferimenti sono relativi a questo JSON):

```json
{
  "frame": 1,
  "error_type": "anatomy_detail",
  "defect": "Mandibola locale non collegata correttamente",
  "subject": "Cerbero canonico rosso/carnoso",
  "correction": "Correggere solo la mandibola della testa centrale",
  "geometry": "Preservare orientamento e proporzioni; chiusura plausibile",
  "connections": "Collo e articolazione mandibolare restano nelle posizioni approvate",
  "preserve": "Altre teste, corpo, zampe, coda, palette, materiali, stile e luce",
  "mask_polygon": [[200, 100], [240, 100], [240, 130], [200, 130]],
  "context_padding": 32,
  "references": [{
    "path": "canonical.png", "revision": "COMMIT_O_VERSIONE_APPROVATA",
    "role": "Identità e articolazione canoniche", "approved": true
  }],
  "prompt": "Correggi esclusivamente la mandibola della testa centrale del Cerbero canonico allegato. Mantieni orientamento, proporzioni, attacco del collo e articolazione obbligatoria. Mantieni invariati altre teste, torso, zampe, coda, palette, materiali, stile pittorico e illuminazione. Una sola modifica locale."
}
```

Per una sorgente senza registrazione corporea, usare `--no-align`; per prove di animazione approvabili completare invece i landmark secondo protocollo.

Coordinate illustrative: **non sono una diagnosi né una maschera approvata del Cerbero**. In alternativa a `mask_polygon`, usare `"mask_from_edit": "ID_DELLA_PARTE"` per riutilizzare una selezione poligonale salvata dall'editor. La selezione resta nella ricetta precedente: per una richiesta di sola maschera lasciarla a trasformazione identità. Nessuna espansione/clipping silenzioso delle maschere fuori frame.

Classificazione senza esportare: stessi argomenti di base con `--patch-diagnose request.json`. Valori supportati: `position`, `alignment`, `scale`, `color`, `alpha`, `rigid_rotation`, `missing_detail`, `anatomy_detail`, `hidden_surface`, `impossible_pose`, `perspective`. La diagnosi è annotata dall'operatore, non inferita dai pixel. Le classi deterministiche e quelle che richiedono un nuovo frame non possono essere esportate come correzione generativa locale.

Il risultato è un nuovo `patch-001/`, poi `patch-002/`, ecc. Non modificarne i file: copiare `generation-template.json` e `registration-template.json` fuori dal fascicolo prima di compilarli.

Inviare `prompt.txt`, originale, crop e riferimenti. Allegare anche i vicini quando utili. La maschera può essere fornita al generatore se supportata; sarà comunque applicata dal tool. Compilare la copia del modello di generazione con servizio reale, provenienza, `prompt_confirmed_exact: true` **solo se il testo è quello davvero inviato**, elenco dei file effettivamente allegati, eventuali ID/modello/parametri esposti. Non inventare seed o prompt interni.

```sh
python scripts/sprite_postprocess.py SOURCE.png --columns 4 --rows 2 \
  --out artifacts/patch-work --patch-import artifacts/patch-work/patch-001 \
  --patch-candidate returned-crop.png --patch-generation generation.json \
  --patch-registration registration.json
```

Il PNG candidato deve avere esattamente le dimensioni di `context.png`. Non viene ridimensionato implicitamente. Il file `registration.json` può contenere:

```json
{
  "landmarks": [
    {"generated": [40, 35], "target": [42, 35]},
    {"generated": [60, 35], "target": [62, 35]}
  ],
  "allow_scale": false,
  "allow_rotation": false,
  "nearest": false,
  "max_residual_px": 2,
  "feather_px": 0
}
```

I landmark sono coordinate **nel crop**, non nel foglio. Target = posizione obbligatoria nello stesso crop sorgente. Un punto consente la traslazione; almeno due punti distinti consentono scala uniforme e rotazione se abilitate esplicitamente. Usare più punti per controllare i residui. La tolleranza è una soglia tecnica configurabile, non un criterio anatomico universale. Senza punti si applica l'identità, segnalata come non verificata geometricamente. Per pixel art selezionare `nearest`; la sfumatura 0–32 px resta interna alla maschera. Trasformazioni che non coprono tutta la maschera vengono respinte: ampliare il contesto in una nuova richiesta.

L'importazione crea `patch-001-attempt-001/` con PNG generato, crop registrato, frame nativo corretto, confronto, ricetta, matrice, metadati di generazione, report, hash e `diagnostics/` (stesso export del tool: PNG, atlas, GIF del ciclo e onion skin).

Per vederla nell'editor avviato con la stessa sorgente/estrazione, aprire `project-patched.json`. In «Correggi» selezionare il livello «Correzione locale esterna»: bordo azzurro = maschera, tratteggio giallo = contesto. Disattivare il livello per confrontare con lo snapshot precedente. Gli altri comandi e l'export usano lo stesso motore. Una correzione che cambia lo snapshot precedente invalida il livello: preparare un nuovo intervento. Il caricamento HTTP ha il limite documentato di 2 MB per progetto; fascicoli/crop particolarmente grandi richiedono la CLI oppure richieste più piccole.

## Riproduzione e decisioni

```sh
python scripts/sprite_postprocess.py SOURCE.png --columns 4 --rows 2 \
  --out artifacts/patch-work --patch-replay artifacts/patch-work/patch-001-attempt-001
```

Verifica gli hash, ripete l'importazione da sorgente e ricetta conservate e confronta esattamente PNG finale, atlas, GIF e progetto. La cartella richiesta e i tentativi possono essere spostati insieme; i collegamenti operativi sono relativi. I vecchi percorsi assoluti restano solo come provenienza. Conservare entrambi nel fascicolo di produzione, non il solo JSON del progetto.

Copiare `review-template.json` fuori dal tentativo, compilare revisore, note, stato `approved` o `rejected`, checklist ed evidenze. Per approvare servono tutti i controlli: difetto risolto, identità, anatomia/meccanica, continuità dei vicini, ancoraggi, materiali/illuminazione, aloni/bordi e scala finale. Il report automatico resta separato. I riferimenti alle evidenze sono dichiarazioni del revisore: non equivalgono a una verifica automatica della registrazione del gioco.

```sh
python scripts/sprite_postprocess.py SOURCE.png --columns 4 --rows 2 \
  --out artifacts/patch-work --patch-review artifacts/patch-work/patch-001-attempt-001 \
  --patch-review-file decision.json
```

Le decisioni vengono aggiunte come `review-NNN.json`, senza riscrivere le precedenti. Per scartare il derivato ricaricare `patch-001/project.json` oppure disattivare il livello; non modificare l'originale. Approvazione dell'asset, integrazione runtime e merge sono gate distinti. **Le GIF diagnostiche non sostituiscono registrazioni reali del gioco.**

## Moduli e archiviazione

- `sprite_patches/diagnosis.py`: classificazione e ammissibilità dell'intervento locale.
- `preparation.py`: geometria della maschera e del crop di contesto.
- `materials.py`: snapshot, riferimenti, prompt, hash e pacchetto esportabile.
- `importer.py`: importazione del PNG esterno nello stesso motore di ricette/export.
- `registration.py`: landmark e trasformazione esplicita.
- `raster.py`: codec limitato e sostituzione RGBA mascherata della ricetta condivisa.
- `verification.py`: confronto esatto, prima/dopo e gate di revisione umana.
- `workflow.py`: orchestrazione CLI, replay e registrazione delle decisioni.

Durante sviluppo: `artifacts/`. Per un intervento reale approvato, archiviare richiesta e tentativi necessari nel fascicolo `assets/hell-race/production/<asset>/candidates/local-corrections/<id>/`, collegandoli al manifest/prompt e rispettando branch, versioni e gate del protocollo. Non duplicare i riferimenti canonici altrove senza necessità: il bundle autocontenuto è per riproduzione; il manifest registra la loro provenienza. Non promuovere automaticamente nulla in `approved/`. Conservare sorgenti, tentativi respinti utili e approvazioni; non versionare tutte le prove temporanee.
