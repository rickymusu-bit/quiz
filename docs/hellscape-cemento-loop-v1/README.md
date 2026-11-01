# Hellscape — ciclo del quartiere di cemento

**Versione:** 1.1.0 · **Data:** 2026-11-01

**Fonte:** produzione e richiesta di archiviazione dell’utente nella conversazione.

**Stato:** archivio aggiornato con il ritocco AB → B approvato dall’utente; nessuna integrazione nel runtime e nessun merge. B mantiene integralmente il master originale: il raccordo approvato interviene solo sulla parte finale di AB.

Sequenza: **A → AB → B → BC → C → CA → A**. Tutti i fondali sono alti **724 px**; periodo complessivo **9845 px**.

| File originale | Dimensioni | Ambiente |
| --- | --- | --- |
| [A](images/hellscape_cemento_A.png) | 2172 × 724 | Foresta verticale |
| [AB](images/hellscape_cemento_AB.png) | 1090 × 724 | Torri → viadotti, con ritocco approvato di cavalcavia e asfalto verso B |
| [B](images/hellscape_cemento_B.png) | 2172 × 724 | Labirinto dei viadotti |
| [BC](images/hellscape_cemento_BC.png) | 1106 × 724 | Viadotti → ventre industriale |
| [C](images/hellscape_cemento_C.png) | 2172 × 724 | Ventre della megastruttura |
| [CA](images/hellscape_cemento_CA.png) | 1133 × 724 | Ventre industriale → torri |

## Anteprime

- [Video del ciclo](previews/anteprima_scorrimento.mp4): 1448 × 724, 30 FPS, 985 fotogrammi, circa 32,83 secondi.
- [Panorama completo del ciclo](previews/hellscape_ciclo.png): 9845 × 724.
- Giunzioni alla scala originale: [A → AB](previews/A_AB.png) · [AB → B](previews/AB_B.png) · [B → BC](previews/B_BC.png) · [BC → C](previews/BC_C.png) · [C → CA](previews/C_CA.png) · [CA → A](previews/CA_A.png).

Il panorama e il video sono stati rigenerati con AB aggiornato. Il video mostra il montaggio scorrevole dei soli asset. **Non è una registrazione del gioco.** L’approvazione riguarda il ritocco mostrato di AB → B; i raccordi non sono certificati come perfettamente continui pixel per pixel.

Confronto della giunzione: [prima](source/guides/AB_B_prima_ritocco.png) · [approvata e corrente](previews/AB_B.png). [AB precedente conservato](source/history/hellscape_cemento_AB_prima_ritocco.png).

## Provenienza

- [Scheda corrente di produzione e verifica](HELLSCAPE_CEMENTO_CICLO_v1.1.0_20261101.md) · [revisione precedente](HELLSCAPE_CEMENTO_CICLO_v1.0.0_20261101.md)
- [Ordine e posizioni dei fondali](ciclo.json)
- [Generazioni, riferimenti e ritagli](generazioni.json)
- [Manifesto dei file](file_manifest.json) e [SHA-256](SHA256SUMS)
- [Prompt effettivamente usati](prompts/) · [guide di riempimento](source/guides/) · [output completi dei raccordi](source/generated/) · [verifiche](provenance/) · [provenienza del ritocco approvato](provenance/AB_B_ritocco_approvato.json)

## Registro

- **1.1.0 — 2026-11-01:** sostituito AB con il ritocco approvato della giunzione verso B; master B preservato, anteprima AB → B e ciclo/video aggiornati, conservati AB precedente, input, prompt e output generativo del ritocco.
- **1.0.0 — 2026-11-01:** archiviazione dei sei PNG citati dall’utente, delle sei giunzioni, del panorama composto, del video e delle fonti necessarie a identificarli e ricostruirne la provenienza.
