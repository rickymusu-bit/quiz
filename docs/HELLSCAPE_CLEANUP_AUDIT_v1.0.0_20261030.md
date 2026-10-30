# Audit pulizia Hellscape — v1.0.0 (2026-10-30)

## Riscontri sul repository
- PR #72 integrata su main; la fase 4 comincia senza cancellazioni non verificate.
- `index.html` carica `assets/hellscape.css`, `assets/home.css`, `assets/responsive.css`.
- `Fool.html` carica `assets/css/game.css`: non eliminare la pagina o il CSS prima di verificare riferimenti e test.
- `Ammo-preview.html` e `assets/ammo-preview.js` sono presenti: verificare dipendenze di `test:ammo` e `--ammo-preview`.
- `scripts/build.cjs` è richiamato da diversi script npm, fra cui `build`, `test:quality`, `test:motion`, `test:ties`, `test:chase`, `test:portal`, `preview:offline` e `preview:ammo`. Non è eliminabile in blocco.
- `test:offline` è ancora definito, ma il funzionamento offline non è più requisito del prodotto.
- Le directory `docs/previews/`, `docs/cerbero/`, `docs/cerbero-v2/` conservano screenshot, GIF e report utili alla revisione: non eliminare prove non sostituite.

## Protocollo di eliminazione
1. Verificare riferimenti in HTML, CSS, JS, test, workflow, documentazione e stringhe dinamiche.
2. Distinguere il sito pubblicato da preview, fixture e codice legacy.
3. Conservare tutto ciò il cui inutilizzo non sia dimostrato.
4. Per modifiche visive, confrontare screenshot reali; per modifiche dinamiche, acquisire GIF reali.
5. Eseguire test pertinenti e CI completa sullo SHA definitivo prima del merge; preservare salvataggi e regole.

## Prossimi interventi nella stessa PR
- Inventario delle dipendenze CSS e dei riferimenti ad asset.
- Matrice build/test/workflow per la pipeline offline.
- Rimozioni mirate soltanto dopo prova di inutilizzo.
- Versioning delle evidenze e documentazione delle esclusioni.

Questa ricognizione **non** dimostra che i file citati possano essere cancellati.
