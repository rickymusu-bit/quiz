# Cerbero — fascicolo di produzione cinematica

**Versione del fascicolo:** 4.2.0 · **Data:** 31 ottobre 2026 (Europe/Rome).  
**Stato:** regia narrativa concordata; asset, clip, transizioni, velocità e timing ancora da produrre/provare. Nessuna modifica runtime documentata dalla PR corrente.

## Documento operativo corrente

**[Cinematica eliminazioni e finale — v4.2.0](PIANO_CINEMATICA_ELIMINAZIONI_FINALE_v4.2.0_20261031.md)** è la specifica prevalente.

- **Eliminazioni:** i superstiti accelerano e abbandonano l'inquadratura; la camera segue Cerbero e perdente insieme. Cerbero recupera fino a una distanza iniziale di circa tre lunghezze del mezzo, lancia una fiammata a distanza, il veicolo si incendia, sbanda **lateralmente** e cade dal ponte nella lava. Si ripete a ogni eliminazione, con i sei veicoli fisicamente distinti. Niente morso, presa, contatto, spinta o testacoda.
- **Vittoria:** il vincitore accelera lasciando Cerbero fuori inquadratura; **solo quando è solo** inizia la caduta del portale dall'alto. Cerbero ricompare poco prima dell'attraversamento; dopo il passaggio completo il portale si autodistrugge in macerie. Cerbero corre fino alle macerie, si arresta, alza la testa, ruggisce e sputa fuoco verso l'alto.
- **Telecamera:** inseguimento condiviso e continuo durante le eliminazioni, anche durante la caduta; movimenti e zoom graduali. Le durate di anteprima (circa 10 s per eliminazione) e la distanza d'attacco vanno tarate in prove reali, senza modificare gli eventi narrativi stabiliti.

**Revisione precedente:** [v4.1.0](PIANO_FIAMMATA_DERAGLIAMENTO_FINALE_v4.1.0_20261031.md), superseduta nei punti incompatibili con v4.2.0. Il [piano v4.0.0](PIANO_FIAMMATA_DERAGLIAMENTO_v4.0.0_20261031.md) e il [v3.0.0](PIANO_CATTURA_SPINTA_LAVA_v3.0.0_20261031.md) documentano l'evoluzione storica, **non** le istruzioni da eseguire oggi. In particolare il v3 prevedeva spinta fisica e rallentamento, che sono stati esplicitamente esclusi.

## Riferimenti tecnici e provenienza

- Modello canonico archiviato: [Cerbero proliferante v1.0.5](../proliferating-reference-v1/README.md), PNG originale invariato e scala uniforme approvata 0,174. Non assumere che l'asset da Gemini proposto in chat sia già stato importato o approvato nel repository.
- [AGENTS.md](../../../../../AGENTS.md) e [protocollo sprite v16](../../../../../docs/PROTOCOLLO_SPRITE_ANIMATI_v16.0.0_20261031.md) per rig, ancoraggi, originali, frame, QA e criteri di approvazione.
- [Manifest di provenienza](manifest.json), [rapporto decisione v2](reports/DECISIONE_CATTURA_v2.0.0_20261031.json), [rapporto pulizia v2.0.1](reports/PULIZIA_CATTURA_v2.0.1_20261031.json) e [archivio del morso](archive/bite-v1/README.md) conservano le evidenze storiche; non sono asset di produzione approvati per la nuova cinematica.

## Modalità di attuazione

1. Verificare i reference canonici e gli asset originali dei sei veicoli.
2. Produrre Cerbero in corsa, avvicinamento e fiammata con VFX ancorati alle bocche reali; non accoppiare le pose a uno specifico veicolo.
3. Validare sulla coupé pilota incendio → sbandata laterale → bordo → caduta nella lava; estendere ai cinque altri mezzi.
4. Integrare la **camera condivisa** e i raccordi evento-dipendenti, compresa la ripresa dell'inseguimento dopo ogni eliminazione.
5. Comporre il finale completo con Cerbero che lascia e poi rientra nel quadro, portale dall'alto e reazione davanti alle macerie.
6. Consegnare registrazioni **reali del browser** e test pertinenti per desktop, mobile, pause/ripresa, FPS e stato di gioco invariato.

Nessun codice, asset approvato o branch principale va modificato/mergiato automaticamente in forza di questo documento. Sono richieste revisione visiva, test e approvazione esplicita prima del merge.
