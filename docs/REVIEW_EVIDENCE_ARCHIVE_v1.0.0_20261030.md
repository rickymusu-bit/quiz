# Archivio delle evidenze dei branch di revisione — v1.0.0

Data: 30 ottobre 2026. Repository: `rickymusu-bit/quiz`.

## Scopo e garanzie

I sette branch di revisione contenevano soltanto file `review/` aggiunti, non modifiche applicative: il confronto `main...branch` ha restituito un solo commit aggiuntivo per ciascun branch e soltanto file nuovi nella cartella `review/`. Nessun contenuto non integrato viene eliminato. Tutti i file sono copiati in questo archivio **riutilizzando direttamente gli SHA dei blob Git**, senza ricodifica, compressione, rigenerazione o modifica dei byte. Gli screenshot sono prove **storiche** di versioni precedenti, non certificano la versione attuale del gioco.

## Inventario verificabile

| Branch originale | HEAD originale (SHA completo) | File archiviati | Byte | Destinazione sotto `docs/review-archive/20261030/` |
|---|---|---:|---:|---|
| `review/chase-acbc154` | `107d49d81dd474412d7507f95e2c2d47436735c3` | 8 | 2909947 | `chase-acbc154/` |
| `review/hellscape-6644b51` | `b55224d746cc60c5994f876d6abb7c23dab2e7cf` | 3 | 2157350 | `hellscape-6644b51/` |
| `review/layout-db61c4e` | `9d3e771429506e0b05a353103457bd65e09ccf39` | 3 | 985068 | `layout-db61c4e/` |
| `review/motion-1811784` | `c8bd2e5c62e52fa6a85f205fe2894626cc01a2cb` | 4 | 1746096 | `motion-1811784/` |
| `review/portal-a29e820` | `64122d744579a8e2569b232b91bba0d97b58894a` | 15 | 6648961 | `portal-a29e820/` |
| `review/tie-6a7a75b` | `766bf68e4f2627d66285bc9122460ba18777d7ee` | 5 | 1312546 | `tie-6a7a75b/` |
| `review/tie-a23546f` | `29272c3a0785495e45077f9d11da81f5f64b271a` | 5 | 1311667 | `tie-a23546f/` |

Totale: **43 file**, **17.071.635 byte**. Il percorso relativo originale sotto `review/` è preservato all'interno di ciascuna sottocartella, inclusi README, misurazioni JSON e screenshot PNG. I due set di spareggio sono separati per evitare sovrascritture.

## Procedura di eliminazione sicura

Il workflow `.github/workflows/branch-prune.yml` elimina un branch `review/*` soltanto se: (1) il nome e l'HEAD coincidono con l'inventario sopra; (2) non esiste PR aperta; (3) il confronto con `main` mostra esattamente un commit aggiuntivo contenente esclusivamente file `review/` nuovi; (4) ogni blob sorgente è presente in `main` sotto la destinazione attesa, con SHA identico; (5) lo SHA del branch viene ricontrollato immediatamente prima della cancellazione. In caso contrario, preserva il branch. Il dry-run sulla PR non cancella nulla.

Questa è un'archiviazione di prove, non un'anteprima corrente. Per la verifica attuale utilizzare le suite CI, gli screenshot reali della revisione finale e le istruzioni di `AGENTS.md`.
