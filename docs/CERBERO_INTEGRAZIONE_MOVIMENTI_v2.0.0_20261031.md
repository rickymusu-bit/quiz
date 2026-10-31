# Cerbero — stato dell’integrazione e direzione corrente

**Versione:** 2.0.0 · **Data:** 31 ottobre 2026, Europe/Rome.
**Fonte:** codice corrente e richiesta utente di sostituire la presa con fiammata, rallentamento, spinta e caduta nella lava.
**Stato:** corsa disponibile come anteprima; nuova cattura ancora in fase di piano.

## Già presente nel codice

- La corsa canonica approvata è conservata in `assets/hell-race/production/cerbero/run-stabilized-v1/`, con sorgente, atlas, otto frame, prompt, landmark e hash. L’approvazione dell’asset non certifica l’integrazione di nuove azioni.
- `assets/hell-cerbero-gallop.js` campiona l’atlante in funzione della distanza; la scena lo usa per la corsa solo nell’anteprima `Fool.html?start=1&cerberoGallop=stabilized`. La larghezza nominale è 221 e il rapporto dell’adattatore è 221/500. Il parametro non sostituisce il renderer delle catture.
- Il renderer precedente rimane usato durante fiammate e catture. Il nuovo piano non è implementato e l’esecuzione corrente non va presentata come sua anteprima.
- `tests/cerbero-gallop.test.js`, `tests/cerbero_gallop_browser.py` e `.github/workflows/cerbero-postprocess.yml` restano pertinenti: integrità/selezione dell’atlante, prova browser della corsa e riproduzione con il tool indipendente bloccato al commit `870e1274aee5fd42ede786cff7eec944087c7771`.
- `scripts/prepare_cerbero_capture_gate1.py` e `.github/workflows/cerbero-capture-gate1.yml` esportano input canonici di Cerbero e il primo frame integro della coupé dal renderer. Il nome storico “gate 1” non implica approvazione della cattura e l’esportazione non dipende dalle pose del morso eliminate dalla cartella attiva.

## Cattura da produrre

Applicare il [piano corrente v2.0.0](../assets/hell-race/production/cerbero/capture-v1/PIANO_CATTURA_SPINTA_LAVA_v2.0.0_20261031.md):

**fiammata a distanza → incendio del veicolo perdente → rallentamento → Cerbero recupera il distacco → contatto e spinta laterale → caduta dal ponte nella lava → ripresa della corsa.**

Verificare prima origine dei getti, bersaglio e velocità relative; quindi appoggi e contatto corpo–fiancata per ogni modello di veicolo. Rispettare il bordo del ponte e le strutture solide, le occlusioni e la gravità. Il rallentamento è parte della rappresentazione di un’eliminazione già decisa, non una nuova regola di punteggio o penalità. Tutti gli eventi seguono il tempo attivo e pausa/ripresa.

Le tre teste possono coprirsi in profondità: non spostarle per mostrarle tutte. Non usare le pose del morso come riferimenti automaticamente approvati per la spinta. I riferimenti necessari devono essere realmente forniti al generatore; conservare originali e prompt effettivi secondo il protocollo sprite v16.0.0.

## Archivio e verifiche successive

La [cartella di produzione](../assets/hell-race/production/cerbero/capture-v1/README.md) distingue piano attuale ed evidenze storiche essenziali. La C-B approvata e due fallimenti diagnostici rimangono tracciati in `archive/bite-v1/`; GIF duplicate, ricette e piani del morso non hanno un ruolo operativo corrente.

Prima dell’integrazione servono approvazione delle nuove pose e della sequenza, verifiche di appoggi/contatti e prove reali del gioco nel browser, senza confondere GIF dei PNG e registrazioni runtime. Nessun merge senza approvazione esplicita.

**Registro:** 2.0.0 — 2026-10-31: sostituisce il documento d’integrazione v1.0.0, rimuovendo i gate di produzione del morso superati; preserva lo stato effettivo della corsa e dei controlli esistenti. Nessuna modifica al codice runtime.
