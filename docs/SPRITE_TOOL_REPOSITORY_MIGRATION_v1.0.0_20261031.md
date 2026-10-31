# Migrazione dello strumento di postprocessing sprite

**Versione:** v1.0.0 · **Data:** 31 ottobre 2026 (Europe/Rome)  
**Stato:** preparazione completata; destinazione esterna non ancora creata, trasferimento e rimozione del codice sorgente da Hellscape **non ancora effettuati**.  
**Origine:** repository `rickymusu-bit/quiz`, main `a0efe419c1c045c7f5f3c990fd1c6137e0576869` prima della rimozione documentale.  
**Pacchetto autonomo:** branch [`migration/sprite-postprocess-standalone-20261031`](https://github.com/rickymusu-bit/quiz/tree/migration/sprite-postprocess-standalone-20261031), commit `1783ea86087503e2624fd0c244bf0066095115ff`.  
**Nome di destinazione proposto:** `rickymusu-bit/sprite-postprocess` (URL NON esistente alla redazione).

## 1. Contenuto dello snapshot pronto al trasferimento

Albero indipendente composto da 43 file, con soltanto Python, editor HTML/CSS/JavaScript statico, moduli di correzione, unit test, browser test, manuali e CI dedicata. Nessun `package.json`, `index.html` di Hellscape, `assets/hell-race.js`, regola del quiz o asset runtime è presente nella root dello snapshot.

Le quattro prove browser che usavano `assets/hell-race/production/cerbero/run-stabilized-v1/` puntano ora a `tests/fixtures/example-creature/`. Il campione binario è copiato byte per byte dalla stessa revisione, ma serve **soltanto ai test** e NON va importato dal codice del programma. L'applicazione non richiede asset di Hellscape.

Le CI sono definite in `.github/workflows/ci.yml`; i test unitari usano `unittest`, mentre i browser test usano Playwright/Chromium. Nel repository originario i test del tool passavano alla revisione precedente; la versione autonoma richiede un proprio run per attestare la portabilità. I quattro browser test conservano il comportamento originale e modificano esclusivamente il percorso delle fixture.

Documentazione di progetto e informazioni di storia non sono necessarie al runtime. Non trasferire il test straordinario `tests/sprite_real_imagegen_browser.py`: dipende da un candidato generativo specifico non archiviato come fixture autonoma.

## 2. Operazioni per creare il nuovo repository

La connessione GitHub disponibile a ChatGPT **non espone un'azione di creazione repository**. Richiede quindi la creazione una tantum di un repository vuoto con nome `sprite-postprocess` nel profilo GitHub.

**Non inizializzare il repository con README o altri file**: il pacchetto contiene già README, `.gitignore` e CI. Non pubblicare una licenza scelta automaticamente: il tool non ha ancora una licenza esplicita trasferita.

Dopo la creazione, confermare l'accesso della connessione GitHub a `rickymusu-bit/sprite-postprocess`. Copiare ogni blob del branch di snapshot nel nuovo repository mantenendo percorsi e hash di contenuto, creare l'albero di commit iniziale e verificare GitHub Actions in modo indipendente.

## 3. Gate di sicurezza prima di ripulire Hellscape

1. Il nuovo repository deve esistere e contenere i 43 file con hash verificati.
2. Devono passare la suite unitaria Python 3.10/3.12 e i quattro test Chromium, salvo difetti dichiarati e risolti.
3. L'editor deve avviarsi in locale senza asset né moduli di Hellscape; verificare esplicitamente l'assenza di dipendenze di importazione.
4. Aggiornare i documenti Hellscape con l'URL reale, un tag o commit/versione fissata e il sistema per recuperare il tool.
5. Solo a quel punto creare una PR di **rimozione** da Hellscape per `scripts/sprite_postprocess.py`, `scripts/sprite_edits.py`, `scripts/sprite_editor_server.py`, `scripts/sprite_editor/`, `scripts/sprite_patches/`, le sole suite di test dedicate e la relativa CI. Rimuovere `requirements-test.txt` soltanto dopo aver verificato che gli altri test del gioco non lo utilizzino: al momento è un file condiviso.
6. **Non cancellare** immagini canoniche del gioco, documentazione di produzione, test di integrazione specifici, manifest storici e snapshot sorgente usati per riprodurre cicli precedenti.

## 4. Protocollo di generazione

La **v15** del protocollo generale è autoritativa nel repository Hellscape. La vecchia v14 viene rimossa su esplicita richiesta dell'utente; rimane recuperabile tramite la cronologia Git e il suo blob SHA `20e6352f5a6de214752adc9bb578840125031464`, ma non come file mantenuto in `main`. Non trasferire tale file nel repository del tool: il workflow del tool si documenta nel suo README e nei manuali `SPRITE_*`.

## Registro

- **v1.0.0, 2026-10-31:** definito snapshot autonomo e gate verificabili; rimozione v14; codice del tool originale mantenuto in Hellscape fino alla riuscita del trasferimento.
