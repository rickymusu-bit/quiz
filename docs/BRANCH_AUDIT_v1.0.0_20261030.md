# Audit e pulizia dei branch Hellscape — v1.0.0

Data: 30 ottobre 2026. Repo: `rickymusu-bit/quiz`, dopo il merge della PR #62, commit `e9a3a947ee8f2c5c79ea7f4f0a3dafc59ffa9ad9`.

## Inventario iniziale

- Branch totali: **66**, di cui `main` e **65 temporanei**.
- **57** branch temporanei hanno una PR già integrata con corrispondenza esatta dell'ultimo commit e senza PR aperte: cancellabili, poiché il contenuto approvato è già presente in `main` tramite merge/squash.
- **1** branch storico, `design/black-stone-bridge` (commit `7c831bfa71f031e8be951e775ea1f9d43ca9ca46`), è antenato di `main` e non aggiunge alcun commit: cancellabile con verifica ulteriore.
- **7** branch di revisione contengono screenshot, misurazioni e file di supporto non presenti in `main`. Non sono automaticamente cancellabili.

## Branch da preservare per esame dell'evidenza

- `review/chase-acbc154` — foto e misure di inseguimento.
- `review/hellscape-6644b51` — confronti home e logo.
- `review/layout-db61c4e` — prove di layout desktop/mobile.
- `review/motion-1811784` — ciclo camminata e parametri.
- `review/portal-a29e820` — screenshot, passaggi e misurazioni del portale.
- `review/tie-6a7a75b` — screenshot e misurazioni spareggio.
- `review/tie-a23546f` — altro set di prove dello spareggio.

Questi sette riferimenti non devono essere cancellati finché non viene confrontata l'evidenza con gli artefatti canonici ancora necessari. La loro presenza è temporanea, non una deroga all'obiettivo di mantenere soltanto `main` permanente.

## Implementazione

Il workflow `.github/workflows/branch-prune.yml` esegue un audit senza eliminazioni sulle PR che modificano la policy e una pulizia effettiva sui push a `main` (o avvio manuale). Ottiene dall'API GitHub l'elenco corrente dei branch e delle PR; verifica che la PR sia stata realmente integrata, che la sua head corrisponda **esattamente** all'ultimo commit del branch, che non ci siano PR aperte, e che il riferimento non sia `main` o protetto. Immediatamente prima di cancellare, ricontrolla lo SHA via `git.getRef`.

Il branch `design/black-stone-bridge` è l'unica eccezione senza PR; è cancellabile solo se nome, SHA e `ahead_by=0` rispetto a `main` coincidono con l'audit.

Nessuna riscrittura della cronologia Git. Nessun branch con prove non integrate viene cancellato automaticamente. I dettagli di ogni esecuzione sono disponibili nei log e nel riepilogo GitHub Actions.

## Passi successivi

1. Verificare il dry-run della PR e la CI obbligatoria.
2. Integrare la PR dopo i controlli: il push a `main` esegue la pulizia protetta.
3. Controllare l'elenco dopo la pulizia e verificare le sette revisioni rimaste.
4. Continuare con refactoring UI, motore, rimozione codice e asset obsoleti; al termine archiviare o eliminare le sette revisioni, preservando soltanto le prove effettivamente utili.
