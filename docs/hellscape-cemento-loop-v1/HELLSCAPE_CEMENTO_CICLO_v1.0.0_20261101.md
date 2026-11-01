# Hellscape — archivio del ciclo in cemento

> Revisione storica precedente al ritocco AB → B. Per i file correnti consultare la [versione 1.1.0](HELLSCAPE_CEMENTO_CICLO_v1.1.0_20261101.md). AB precedente è conservato in `source/history/hellscape_cemento_AB_prima_ritocco.png`.

**Versione:** 1.0.0 · **Data:** 2026-11-01.

**Fonte:** brief e approvazioni della conversazione; richiesta corrente dell’utente di caricare queste immagini e il video del ciclo su GitHub.

**Revisione del progetto consultata:** `rickymusu-bit/quiz`, `30b5df8b5955640f38defb6b03e1edc39a524415`.

**Stato:** archiviazione di produzione; nessuna modifica al renderer, ai caricamenti degli asset o al gameplay.

## Ambito e precedenza

Il quartiere iniziale viene rappresentato con **cemento armato, acciaio e asfalto**, secondo il brief corrente dell’utente, che supera per questa produzione la precedente descrizione della pietra caotica. Restano come riferimenti di progetto [AGENTS.md](../../AGENTS.md), la [direzione Bafometto v1.2.0](../HELLSCAPE_BAFOMETTO_DIREZIONE_CINEMATICA_v1.2.0_20261031.md) e le [regole Hellscape v1.0.1](../HELLSCAPE_PROJECT_RULES_v1.0.1_20261031.md).

Sono conservate le versioni locali dei link richiamati dall’utente immediatamente prima della richiesta di caricamento: A/B/C e i raccordi ottenuti tramite riempimento centrale, con la correzione generativa dell’asfalto AB. Gli artwork successivi mostrati dall’utente da Leonardo o Gemini e i tentativi scartati di canvas largo non appartengono a questo pacchetto.

A/B/C sono i principali già approvati nella conversazione. I raccordi restano candidati con limiti noti: l’autorizzazione corrente riguarda l’archiviazione su GitHub, non una nuova approvazione di ogni giunzione né l’integrazione nel runtime.

## File canonici e ordine

Tutti i PNG in `images/` sono copiati senza modificare i byte dei file locali selezionati.

| Ordine | File | Dimensioni | X iniziale nel ciclo |
| --- | --- | --- | --- |
| 1 | `images/hellscape_cemento_A.png` | 2172 × 724 | 0 |
| 2 | `images/hellscape_cemento_AB.png` | 1090 × 724 | 2172 |
| 3 | `images/hellscape_cemento_B.png` | 2172 × 724 | 3262 |
| 4 | `images/hellscape_cemento_BC.png` | 1106 × 724 | 5434 |
| 5 | `images/hellscape_cemento_C.png` | 2172 × 724 | 6540 |
| 6 | `images/hellscape_cemento_CA.png` | 1133 × 724 | 8712 |

Periodo: **9845 × 724 px**, quindi ritorno ad A. Le larghezze differenti dei raccordi seguono la successiva disposizione esplicita dell’utente. A è dominata dalle verticali, B da viadotti orizzontali e diagonali, C da cavità e tubazioni monumentali.

`ciclo.json` contiene ordine, dimensioni e posizioni relative. `previews/hellscape_ciclo.png` accosta i sei PNG senza blending, deformazioni o ridimensionamenti.

## Generazione e ritaglio

I principali sono stati prodotti con chiamate individuali e sequenziali. Per B e C sono state effettuate correzioni di formato prima di selezionare i master. I prompt completi realmente usati per i master finali sono conservati in `prompts/A.txt`, `B.txt` e `C.txt`; non sono ricostruzioni a posteriori.

Per i raccordi la disposizione dell’utente è stata: fornire **una sola immagine guida** con estremità del precedente, vuoto bianco e estremità del successivo; completare il centro e ritagliare i contesti.

Ogni guida iniziale contiene 512 pixel del bordo destro del precedente, 1148 pixel bianchi e 512 pixel del bordo sinistro del successivo, con altezza 724. Tre chiamate individuali e sequenziali hanno prodotto AB, BC e CA. Una quarta chiamata ha corretto l’asfalto AB usando una nuova guida con sola porzione della strada bianca.

Il generatore ha parzialmente reinterpretato i contesti. I punti di taglio sono stati individuati confrontando i contesti effettivi con 128 pixel degli originali, entro ±160 pixel dalla posizione nominale, con affinamento del taglio entro un pixel. I PNG finali sono ritagli puri dei risultati selezionati, senza resize, morphing o ritocchi programmatici.

| Raccordo | Output completo conservato | Crop, coordinate semiaperte |
| --- | --- | --- |
| AB | `source/generated/AB_completamento_asfalto.png` | `[511, 0, 1601, 724]` |
| BC | `source/generated/BC_completamento.png` | `[512, 0, 1618, 724]` |
| CA | `source/generated/CA_completamento.png` | `[512, 0, 1645, 724]` |

Sono conservati anche il primo completamento AB usato per la guida della correzione stradale, tutte le quattro guide realmente fornite e i relativi prompt. `generazioni.json` mappa i file selezionati; `provenance/` conserva misure, rettangoli e metadati. I percorsi del workspace presenti in `provenance/copie_sorgenti.json` sono solo provenienza storica; i riferimenti operativi del pacchetto sono relativi.

## Anteprime e limiti

Le sei immagini di giunzione in `previews/` mostrano gli ultimi 480 pixel del precedente e i primi 480 del successivo, senza sfumature o sovrapposizioni: il punto di accostamento è a x=480, su immagini 960 × 724.

Il video `previews/anteprima_scorrimento.mp4` è quello già consegnato nella conversazione: viewport 1448 × 724, 30 FPS, 985 fotogrammi, durata circa 32,83 secondi, H.264. È un ritaglio mobile alla scala 1:1 del panorama composto, con riavvolgimento sui pixel iniziali di A. **Non è una registrazione del runtime del gioco** e non viene usato come prova di integrazione.

Le strutture si raccordano meglio rispetto ai primi candidati, ma restano differenze locali di microtexture e tono dell’asfalto. Le differenze medie assolute RGB delle colonne estreme sono circa 8,80 per A→AB, 7,42 per AB→B, 9,49 per B→BC, 13,67 per BC→C, 10,23 per C→CA e 7,78 per CA→A su scala 0–255. Si tratta di misure descrittive, non di una soglia percettiva o di una certificazione della continuità geometrica.

Il generatore non espone una garanzia di maschera rigida: i contesti possono essere reinterpretati. I principali originali approvati sono comunque conservati integralmente. Non sono inventati seed, controlli o impostazioni non esposte.

## Verifiche di archiviazione

Verificati integrità e dimensioni dei PNG, altezza comune, hash rispetto ai file locali selezionati, uguaglianza dei pixel dei crop rispetto ai completamenti, ricostruzione del panorama composto e dei sei accostamenti, metadati effettivi del video tramite ffprobe e collegamenti relativi della documentazione. `file_manifest.json` e `SHA256SUMS` identificano i byte archiviati.

La modifica aggiunge soltanto questo archivio in `docs/`. Non cambia i riferimenti agli asset del gioco, non sostituisce asset precedenti e non aggiorna la descrizione globale dei quartieri. Le verifiche funzionali del runtime non costituiscono la validazione di questo caricamento di file.

## Registro

- **1.0.0 — 2026-11-01:** archiviati sei fondali, sei accostamenti, panorama composto e video, con guide, completamenti selezionati, prompt e tracciabilità; nessuna integrazione o merge.
