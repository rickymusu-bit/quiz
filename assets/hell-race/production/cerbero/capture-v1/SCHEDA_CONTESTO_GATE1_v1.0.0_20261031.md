# Cerbero — scheda di contestualizzazione per la cattura (Gate 1)

**Versione:** v1.0.0  
**Data:** 31 ottobre 2026 (Europe/Rome)  
**Fonte:** piano di cattura in `PIANO_ASSET_CATTURA_v1.0.0_20261031.md`; protocollo generale v15; approvazione di procedere dopo la PR #100.  
**Stato:** estrazione e audit degli input canonici; C-B, C-C, V1 e composito X1 **non ancora prodotti o approvati**.

## Riferimenti realmente controllati

- `assets/hell-race.js`: camera a inseguimento, scena laterale, movimento verso destra; ordinamento canonico veicoli `[chopper,pickup,truck,coupe,offroad,ape]`, coupé = riga 3 a indice zero. L'atlante `vehicles-drive-v1.webp` ha silhouette di dimensioni disuniformi: la funzione `vehicleRow` segmenta la silhouette in `HTMLCanvasElement` e la funzione `vehiclePreview` usa il primo fotogramma. **Non** ritagliare il WebP a quote arbitrarie.
- `assets/hell-race/production/cerbero/run-stabilized-v1/frames/001.png` e `008.png`: candidati integrali di raccordo C-A, con provenienza e hash conservati. La scelta fra i due richiede giudizio su appoggi e dinamica, non è automatica. `landmarks.json` contiene solo punti toracici stimati con incertezza e **non** comprende pivot della mandibola.
- `assets/hell-cerbero-gallop.js`: rendering del ciclo 4×2, celle 552×522; anteprima opzionale, non sostituzione automatica del renderer di cattura. `assets/hell-cerbero.js` rimane sorgente delle tre bocche durante le fiammate.
- `scripts/prepare_cerbero_capture_gate1.py`: estrae nell'ambiente browser il **medesimo frame coupé originale del renderer** e conserva i due frame di Cerbero senza trasformazioni. Esporta in `artifacts/capture-gate1/` PNG trasparenti e report con hash SHA-256. I PNG sono input temporanei e non dichiarazioni di approvazione.
- `sprites-post` resta il tool **esterno** in `rickymusu-bit/sprites-post`, versione bloccata nella pipeline di verifica precedente al commit `870e1274aee5fd42ede786cff7eec944087c7771`. Verrà usato per allineamento, QA di palette/trasparenza e atlante **dopo** aver acquisito le nuove pose. Il tool non viene duplicato qui.

## Scheda tecnica e biomeccanica

| Asse | Dato verificato / vincolo |
| --- | --- |
| Soggetto | Un solo Cerbero rosso/carnoso, tre teste ognuna anatomicamente connessa al torso, quattro zampe, coda, vista laterale |
| Ruolo | Predatore inseguitore; animazione di cattura visibile soltanto per giocatori eliminati dal motore |
| Scena | Cerbero sul lato sinistro della coupé e diretto a destra; presa sul lato posteriore del mezzo |
| Scala | Render canonico nel Canvas; posizione/scala di contatto da calibrare con composito X1 e screenshot reale |
| Materia | Arti articolati e colli con inerzia, bocca centrale con apertura al perno; carrozzeria rigida prima dell'urto |
| Forze | Spinta degli arti posteriori nella fase reach, inerzia positiva al contatto, frenata anteriore solo dopo il morso |
| Vincolo | Durante C-C–C-E il punto bocca centrale e l'ancora posteriore del veicolo condividono la stessa posizione nello spazio mondo |
| Pose | C-A finale falcata, C-B estensione e fauci aperte, C-C chiusura senza teletrasporto; poi C-D frenata e C-E strattonamento |
| Timing | Parametrico e non fissato prima di vedere l'anteprima al ritmo di gioco |
| Tecnica | Nuove silhouette B/C da ImageGen con riferimenti canonici effettivamente allegati; nessun warp elastico su ossa o metallo; trasformazioni rigide solo su sottoparti approvate |
| Stato | Due candidati A e coupé V0 estraibili via script; C-B/C-C e anchor bocca/posteriore assenti |

**Gate di ingresso a C-B:** controllare gli output del workflow `Cerbero — capture gate 1 canonical-input audit` sullo stesso SHA di revisione, confrontarli visivamente e fornire entrambi i riferimenti grafici alla generazione. Non generare il Cerbero dalla sola descrizione o da un vecchio asset nero non canonico.

## Criteri del prossimo gate

1. Selezionare C-A solo dopo valutazione di equilibrio, fase d'appoggio e raccordo con il ciclo di corsa.
2. Generare separatamente C-B e C-C con il Cerbero completo: tre colli, tre teste, quattro zampe, senza oggetti o fondale, con proporzioni invarianti. Il fotogramma C-C deve seguire C-B per cause fisiche leggibili, non solo differire per la bocca.
3. Annotare per B e C pivot mandibola centrale, ancoraggio bocca e traiettoria degli arti portanti; per V0 il punto di presa posteriore. **Non inventare coordinate prima di esaminare le nuove pose.**
4. Creare X1 come composito deterministico mantenendo pixel invariati di due layer; verificare occlusione, contatto e scala reale.
5. Passare `sprites-post` sugli output nuovi, conservando sempre gli originali e le differenze derivati. Prima di integrazione e merge: GIF vera dal browser, screenshot e CI verde.

## Registro revisioni

- v1.0.0 — 2026-10-31: scheda d'ingresso contestuale e biomeccanica; esportazione riproducibile degli input originali tramite gioco. Nessuna posa nuova sostituita o convalidata.
