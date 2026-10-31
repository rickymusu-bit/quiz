# Cerbero — produzione della cattura

**Versione fascicolo:** 3.0.0 · **Data:** 31 ottobre 2026, Europe/Rome. Timestamp in `manifest.json`.
**Stato:** piano corrente, nessuna nuova posa o modifica runtime. [PR #103 in bozza](https://github.com/rickymusu-bit/quiz/pull/103).

La sequenza richiesta è **fiammata a distanza → incendio del veicolo perdente → rallentamento → Cerbero lo raggiunge → spinta laterale → caduta dal ponte nella lava → ripresa della corsa**. Applicare il [piano v3.0.0](PIANO_CATTURA_SPINTA_LAVA_v3.0.0_20261031.md) e il [documento d’integrazione corrente](../../../../../docs/CERBERO_INTEGRAZIONE_MOVIMENTI_v3.0.0_20261031.md).

Il modello canonico per le nuove animazioni è il [Cerbero proliferante approvato](../proliferating-reference-v1/README.md), pacchetto 1.0.5: primo PNG originale invariato, scala 0,174 dopo la riduzione del 40%. Il ciclo storico a tre teste resta conservato e non è stato aggiornato al nuovo design. Prima di ogni generazione fornire realmente i riferimenti allo strumento, verificandone percorso e hash secondo il protocollo v16.0.0. Il piano è ancora da tradurre in nuove pose, effetti e prove del gioco.

## File attuali

- `PIANO_CATTURA_SPINTA_LAVA_v3.0.0_20261031.md`: piano corrente; 2.0.0 rimane la penultima revisione storica.
- `manifest.json`: percorsi correnti, versioni, hash, stato e collegamento all’archivio.
- `reports/DECISIONE_CATTURA_v2.0.0_20261031.json`: richiesta che ha sostituito il morso.
- `reports/PULIZIA_CATTURA_v2.0.1_20261031.json`: inventario della pulizia e verifiche.
- [Archivio essenziale del morso](archive/bite-v1/README.md): posa approvata, due fallimenti diagnostici, prompt effettivi, decisioni e replay della sola C-B approvata.

Piani, prompt proposti, GIF/onion skin duplicate, manifest intermedi e ricette delle pose accantonate sono stati rimossi dalla cartella attiva. L’archivio conserva i file necessari per capire gli errori e riprodurre l’asset approvato: non è un piano alternativo da eseguire. Non dipende dalla sopravvivenza del branch per preservare queste evidenze.

## Versioni e controlli

Uso `MAJOR.MINOR.PATCH` per il pacchetto: MAJOR per un cambio incompatibile dell’azione, MINOR per una posa/capacità compatibile, PATCH per correzioni e manutenzione. **3.0.0** adotta la nuova identità proliferante approvata; **2.0.1** documenta la pulizia precedente. Il nuovo riferimento ha pacchetto **1.0.5**, la C-B storica **1.0.1**, il protocollo **16.0.0**. ID dei tentativi, date e timestamp restano distinti dalle versioni.

La pulizia verifica collegamenti, hash degli asset conservati, invarianza degli asset esterni al fascicolo e replay della C-B approvata. Nessun codice runtime è modificato, nessuna nuova animazione è dichiarata completata. Il workflow storico di audit degli input e i controlli della corsa restano utili e sono mantenuti. Nessun merge senza approvazione esplicita.
