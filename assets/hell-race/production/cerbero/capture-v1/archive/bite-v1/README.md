# Archivio essenziale della cattura con morso

**Indice:** versione 2.0.1, 31 ottobre 2026. Questo archivio non prescrive la produzione corrente.

La cattura con morso è stata sostituita da fiammata, rallentamento e spinta nella lava. Sono conservati direttamente nel repository:

- [C-B 1.0.1 approvata](approved/002_C_B_masked_v1.0.1_20261031.png), il PNG grezzo da cui deriva, la maschera e la documentazione necessaria al replay.
- [C-B 1.0.0 respinta](diagnostics/001_C_B_aligned_v1.0.0_20261031.png): la testa centrale veniva enfatizzata alterando la posizione della testa destra.
- [C-C 1.1.0 non approvata](diagnostics/003_C_C_masked_v1.1.0_20261031.png): morso della sola testa centrale troppo alto rispetto al veicolo; la successiva azione è stata accantonata. È una prova diagnostica, non un asset pronto.
- I tre `prompts/*_request_*.json` contengono i testi effettivamente inviati e gli argomenti reali delle chiamate. Non sono ricostruzioni. Conservati anche preflight, approvazione, bocciatura, verifica e raffinamento della maschera pertinenti.

`index.json` mappa ogni percorso storico al file conservato e ne registra SHA-256, ruolo e stato. Gli argomenti originali delle chiamate e i report storici restano immutati: i percorsi che vi compaiono sono provenienza storica, da risolvere con l’indice, non nuovi collegamenti operativi. I file di testo duplicati dei prompt sono rimossi perché la stringa esatta resta nel campo `arguments.prompt` dei request JSON. Il prompt interno del servizio e i seed non erano esposti.

La C-B conserva l’approvazione per l’esatta immagine della vecchia azione. Non approva una posa di spinta o l’integrazione. I due fallimenti rimangono per documentare perché non si devono spostare le teste per esporle, né dedurre il contatto dal solo sprite isolato.

## Replay della C-B approvata

Il wrapper richiama le API dello stesso tool esterno `rickymusu-bit/sprites-post`, bloccato al commit `870e1274aee5fd42ede786cff7eec944087c7771`. Rispetto al wrapper storico sono cambiati solo il percorso del fascicolo e quello del canonico; i pixel e la ricetta di reinserimento non cambiano. Le ricette JSON con PNG incorporati e le GIF diagnostiche duplicate non sono archiviate: si ricostruiscono dal grezzo e dalla maschera.

```bash
python assets/hell-race/production/cerbero/capture-v1/archive/bite-v1/reports/REPLAY_C_B_ARCHIVIO_v2.0.1_20261031.py \
  --repo /percorso/quiz --tool-root /percorso/sprites-post --out /tmp/cb-archivio-nuovo
```

Confrontare `002_C_B_masked_v1.0.1_20261031.png` prodotto dal replay con quello in `approved/`, su tutti i canali RGBA. Gli output e le GIF del replay sono diagnostici locali, non registrazioni del gioco. Le versioni e gli hash originali dei materiali restano quelli storici; 2.0.1 identifica esclusivamente la manutenzione dell’archivio.
