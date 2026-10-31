# Trasferimento del postprocessing nel repository autonomo

**Versione:** v1.1.0 · **Data:** 31 ottobre 2026 (Europe/Rome)  
**Repository di destinazione:** [rickymusu-bit/sprites-post](https://github.com/rickymusu-bit/sprites-post)  
**PR di importazione:** [sprites-post #1](https://github.com/rickymusu-bit/sprites-post/pull/1)  
**Sorgente dello snapshot:** commit [1783ea8](https://github.com/rickymusu-bit/quiz/commit/1783ea86087503e2624fd0c244bf0066095115ff) (branch temporaneo di migrazione).  
**Protocollo generale:** [sprite v15](PROTOCOLLO_SPRITE_ANIMATI_v15.0.0_20261031.md).

## Ambito del trasferimento

Il repository `sprites-post` contiene il programma di allineamento, estrazione, editor locale, correzioni mascherate, registrazioni deterministiche, test, documentazione e CI dedicata. Le fixture grafiche sono **solo input dei test**: non sono asset da caricare nel runtime di Hellscape.

Questa modifica toglie dal repository del quiz soltanto i moduli di tool, i test specializzati, la loro CI e i manuali duplicati. Lascia inalterati codice di gioco, asset approvati di Cerbero e veicoli, manifest, GIF diagnostiche storiche, script sorgente di riproduzione conservati nelle directory di produzione, sistema di immagini, `requirements-test.txt` condiviso e protocollo universale v15.

## Dipendenza e gate

1. Integrare la [PR #1 di sprites-post](https://github.com/rickymusu-bit/sprites-post/pull/1) soltanto con test Python 3.10/3.12 e browser completati.
2. Verificare albero dei file, hash dei blob copiati, corretta gestione dei PNG di fixture e documentazione; controllare l'avvio autonomo dell'editor.
3. Mantenere questa PR di rimozione in bozza e **non integrarla** finché il nuovo repository non è stato verificato in `main`.
4. Dopo l'integrazione, documentare la revisione/tag preciso della dipendenza in questa nota, evitare dipendenze dal ramo `main` mobile.
5. Per gli interventi futuri sull'editor o su ImageGen applicare fix e test in `sprites-post` e non ricreare duplicati nel quiz.
6. Mantenere il processo di approvazione esplicita prima del merge e le evidenze richieste per le variazioni dinamiche in gioco.

## Provenienza

La versione [v1.0.0](SPRITE_TOOL_REPOSITORY_MIGRATION_v1.0.0_20261031.md) conserva il piano precedente, redatto quando il repository di destinazione non esisteva. I file trasferiti sono tracciati nella cronologia Git e nel file `MIGRATION.md` del progetto standalone. Non rimuovere retroattivamente i file approvati relativi al Cerbero per simulare una separazione più pulita.
