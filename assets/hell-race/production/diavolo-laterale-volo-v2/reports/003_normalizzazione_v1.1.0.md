# Normalizzazione dimensioni e colore A/M/B — v1.1.0

30 ottobre 2026. L'utente accetta M e richiede allineamento di dimensioni e colore. Originali immutati. GIF aggiornata nella stessa identità `libfile_c58806edd8488191bb1bad9fa3493ce8`, nuova revisione 1, nome `Hellscape_diavolo_A_M_B_v1.1.0_20261030.gif`.

Editing generativo di solo colore tentato con prompt 003; output `exec-0c542b35-014f-4f58-9c72-900b1c91ee22.png` non adottato: ha cambiato anche inquadratura. Il risultato finale riusa la geometria del midpoint approvato. Normalizzazione tecnica globale secondo protocollo: scala uniforme e traslazione da 5 corrispondenze corporee annotate manualmente, curve cromatiche monotone calibrate su regioni di corpo/armatura stabili, nessun warp o ridisegno di parti. Il colore è normalizzato sui campioni, non una promessa di pixel identici su tutto il soggetto.

Scala M: 0.6795326775. Traslazione verso coordinate di A: (-114.3807,110.5127), poi padding comune (35,35). B traslato di (-842,0), poi padding. RMS residuo dei punti annotati 13.48 pixel dell'asset: corrispondenze stimate visivamente, differenze di proporzione residue. Allineamento globale migliorato ma non validazione anatomica perfetta. Regioni, curve, coordinate e hash sorgenti in registration_v1.1.0.json.

Colore su regioni stabili: mediana RGB M (72,39,30) → (65,38,30), uguale al riferimento A sui campioni corrispondenti; B (64,39,31) → (65,38,31). Alpha mantenuto durante la correzione colore; originali e PNG normalizzati trasparenti. Canvas comune 1000×960; GIF 800×768, 4 frame A-M-B-M a 550 ms, palette unica per evitare variazioni di quantizzazione fra pose. Nessun timing finale o rig realizzato.

Verifiche effettuate: esecuzione script, PNG e alpha, numero/dimensioni frame GIF, ispezione dei tre stati in montaggio; nessun test o cattura dal gioco perché non integrato. Script riproducibile con `--sheet TAVOLA_AB.png --midpoint M.png --out DESTINAZIONE`. Dipendenze Pillow, NumPy, SciPy. I PNG originali sono quelli generati e consegnati nella conversazione; i byte non sono ancora nel fascicolo Git. Non dichiarare completata la consegna dei PNG nel repo.
