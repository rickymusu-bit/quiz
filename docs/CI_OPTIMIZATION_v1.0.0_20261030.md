# Ottimizzazione CI Hellscape — v1.0.0

Data: 30 ottobre 2026. Fonte di riferimento: workflow GitHub Actions eseguito sul commit `2068cb74`, run `41006850140`.

## Misure prima dell'intervento

- Durata totale della pipeline: circa 18 minuti.
- Suite legacy offline: 762 s di test, ora rimossa dalla CI obbligatoria dalla PR #61.
- Spareggio: 537 s di test; inseguimento: 334 s; browser generale: 326 s.
- Installazione e setup della maggior parte dei job: circa 15–25 s, quota minore rispetto alla durata delle prove.
- `max-parallel`: 6; artefatti caricati dai job fino a oltre 200 MB, con esportazioni HTML autonome non necessarie alla revisione. Nella prima CI di questa PR (run `41009763303`) sono stati misurati 8 min 50 s complessivi, `portal` 412 s, `ammo` 338 s.

## Ottimizzazione proposta

1. Il job `impact` classifica i file cambiati usando l'API GitHub. Con modifiche **esclusivamente** a `docs/**`, `README.md`, `AGENTS.md` e `.gitignore`, il job grafico viene saltato; un unico job `verify` termina correttamente e resta disponibile come controllo stabile. Gli altri file, le liste vuote e gli errori di classificazione comportano la suite completa. Si considera l'intera PR o l'intero intervallo di commit del push, non soltanto l'ultimo commit.
2. Spareggio suddiviso in `ties-matrix-even`, `ties-matrix-odd`, `ties-scenarios`: le combinazioni viewport/DPR sono partizionate senza sovrapposizione; le simulazioni complete di eliminazione, nuovi giri, persistenza e movimento ridotto restano eseguite una volta.
3. Inseguimento suddiviso in `chase-cinematic`, `chase-matrix-even`, `chase-matrix-odd`: 0/1/2 perdenti e finali statici nella prima; tutti i campioni viewport/DPR nelle altre due.
4. Browser generale suddiviso in `browser-main` e `browser-secondary`: stesso elenco di script, ordine locale preservato nel comando integrale.
5. Portale suddiviso in `portal-cinematic`, `portal-matrix-even`, `portal-matrix-odd`: un'intera cinematica con GIF, pause, continuità dello stato, finali Game Over e movimento ridotto; le 40 verifiche grafiche viewport/DPR ripartite in 20+20.
6. Ammo suddiviso in `ammo-primary`, `ammo-secondary`, `ammo-modes`, `ammo-materials`: tutti i 9 tipi su ciascuno dei 3 viewport (15+12 attivazioni), tutti i 4 casi speciali, ripresa da salvataggio, layout del ponte e demo dei 9 effetti grafici su tre schermi. I comandi `--case` preesistenti restano utilizzabili.
7. `max-parallel` elevato da 6 a 12 (soggetto alla disponibilità effettiva dei runner); job `core` senza installazioni Python/browser non necessarie.
8. Gli upload non includono più grandi HTML autonomi di revisione; restano screenshot, GIF e rapporti. Compressione disabilitata per media già compressi e retention limitata a 7 giorni.

## Compatibilità e verifica

- **Nessun file dell'applicazione o dataset modificato.**
- Comandi integrali `npm run test:browser`, `npm run test:ties`, `npm run test:chase`, `npm run test:portal`, `npm run test:ammo` ancora validi senza `HELLSCAPE_CI_PART`.
- Le nuove partizioni sono selezionabili con `HELLSCAPE_CI_PART`: `matrix-even`, `matrix-odd`, `scenarios` per lo spareggio; `matrix-even`, `matrix-odd`, `cinematic` per inseguimento e portale; `primary`, `secondary`, `modes` per Ammo.
- L'insieme delle prove dei gruppi è uguale a quello della suite originale; non ridurre il numero di viewport, fattori DPR o finali.
- Verificare che la PR abbia 23 shard verdi, `impact` e `verify` verdi, e che le PR documentali saltino gli shard senza apparire come controlli in sospeso.
- Raccogliere durata totale delle run CI di questa modifica e dopo il merge su `main` per un confronto reale: non considerare stimata la durata migliorata.

## Ripristino

Ripristinare `.github/workflows/refactoring.yml` e gli script test dal commit base di questa PR se le partizioni presentano regressioni o il nuovo controllo `verify` perde affidabilità. Non cancellare gli scenari per compensare un errore di test.
