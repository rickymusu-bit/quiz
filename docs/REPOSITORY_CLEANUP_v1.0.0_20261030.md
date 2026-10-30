# Pulizia repository Hellscape — v1.0.0 (30 ottobre 2026)

## Perimetro

Pulizia conservativa degli **artefatti di revisione storici**; nessuna modifica a motore, interfaccia, dataset, CSS, asset caricati dal runtime, esportazione offline o salvataggi.

Base: `main` alla revisione `2068cb74a63213674a2d1464b1e7aaa928bac3ca`.
Prima della pulizia: **418 file**, **478.341.114 byte** nell'albero Git (somma delle dimensioni logiche, non dimensione del database Git).
Proposta di rimozione: **21 file**, **71.732.389 byte** (~71,7 MB), esclusivamente vecchie evidenze visive.

## Rimossi dall'albero attivo

| Percorso | Motivo |
| --- | --- |
| `docs/previews/portal-azure/` | Prototipo del portale sostituito dalla versione nativa di taglio e dal successivo portale oro/rocce |
| `docs/previews/portal-side/` | Revisione intermedia, già superata dalla versione oro/rocce e dalla verifica integrata |
| `docs/previews/antisigillo/` | Registrazione di un Omen rimosso dalle regole attive |
| `docs/previews/black-bridge/` | Prima registrazione del ponte, sostituita da `docs/previews/black-bridge-v2/` |
| `docs/screenshots/timer-width/` | Prima revisione del timer, superata dalle successive catture del timer e delle Omen |

Queste eliminazioni **non cancellano la cronologia Git**: tutti i vecchi file restano recuperabili alla revisione base indicata sopra. Non è stata riscritta la cronologia, né si è intervenuti sulle impostazioni GitHub Pages.

## Materiali conservati

- `docs/previews/final-review/` e `docs/previews/orientation/`: verifiche di funzionamento e registrazione integrata
- `docs/cerbero/`, `docs/cerbero-v2/`, `docs/turni-cerbero/`: prove e riferimenti di movimento, inclusi anatomia, fuoco e camera
- `docs/design/`: concept e riferimenti visivi approvati
- `docs/PROTOCOLLO_SPRITE_ANIMATI_v7_20261029.md` e `v8_20261029.md`: penultima e ultima revisione del protocollo
- Tutti i file sotto `assets/`, `dataset/`, `tests/`, `scripts/`, oltre ai punti d'ingresso del sito

## Politica operativa

1. Scrivere nuove registrazioni temporanee, log e screenshot di test sotto `artifacts/`, già ignorata da Git. Conservare nel repository solo evidenze di riferimento realmente necessarie alla revisione e alla documentazione.
2. Non versionare sequenze GIF ripetitive per ogni prova intermedia; tenere quando utile l'ultima versione e la penultima, con riferimento al commit esatto da cui provengono.
3. Dopo ogni PR approvata e unita, eliminare il branch temporaneo verificando che non abbia modifiche residue. Solo `main` deve rimanere permanente.
4. Evitare eliminazioni basate sul solo nome: verificare riferimenti da codice, test, documentazione ed esportazione offline. La pulizia di codice e asset ancora attivi è distinta dal presente intervento.
5. Prima del merge eseguire le verifiche GitHub Actions pertinenti. **La creazione di questa proposta non equivale all'esecuzione dei test.** Non fare merge senza approvazione esplicita.

## Limiti

Le dimensioni della cronologia remota non diminuiranno automaticamente: togliere file dall'albero corrente riduce il checkout e i file distribuiti, ma i blob storici restano nei commit precedenti. Un'eventuale riscrittura della storia richiederebbe un progetto separato, backup e consenso esplicito; non è prevista.

La pulizia dei branch remoti va verificata separatamente: non deve includere `main`, branch con PR aperte o lavori non integrati.
