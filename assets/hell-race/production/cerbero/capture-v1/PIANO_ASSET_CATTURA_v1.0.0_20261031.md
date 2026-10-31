# Hellscape — Piano di produzione dell'animazione di cattura di Cerbero

**Versione:** v1.0.0 · **Data:** 31 ottobre 2026 (Europe/Rome)  
**Stato:** proposta di produzione; nessun PNG di cattura generato, approvato o integrato con questa revisione.  
**Repository:** `rickymusu-bit/quiz` · **Destinazione:** `assets/hell-race/production/cerbero/capture-v1/`  
**Ambito:** un'unica cattura riutilizzabile per i sei veicoli, con una prova iniziale sulla **coupé**.  
**Fonte:** richiesta dell'utente del 31/10/2026, discussione su morso in corsa, frenata, strattonamento, fuoco e distruzione.  
**Convenzioni:** `AGENTS.md`, `docs/PROTOCOLLO_SPRITE_ANIMATI_v12.0.0_20261030.md` (attuale riferimento di `main` al momento della stesura); nella PR #92 è proposta la v13 con riferimenti alla biomeccanica: verificare lo stato prima di produrre.  

## 1. Materiale verificato, da riutilizzare

- `assets/hell-race/production/cerbero/run-stabilized-v1/README.md`: ciclo di corsa *stabilizzato per revisione*, otto pose RGBA `frames/001.png`–`008.png`, `atlas.png`, `references/`, `landmarks.json`. La stabilizzazione del torace è diagnostica, **non** garanzia di correttezza biomeccanica né di integrazione nel gioco.
- `assets/hell-race/vehicles-drive-v1.webp` e `assets/hell-race/PROMPTS-v1.md`: sei veicoli canonici, in ordine chopper, pick-up, camion, coupé, fuoristrada, Ape. Verificare l'esatto rendering e lo stato delle varianti sulla revisione di sviluppo.
- `assets/hell-race.js`, `assets/hell-cerbero.js`, `assets/hell-ending.js`, `assets/hell-chase.js`: renderer e transizioni da ispezionare prima dell'integrazione; la presenza del modulo non garantisce che l'asset sia in uso.
- `docs/HELLSCAPE_SPEC_CINEMATICHE_v1.2.0.md`: specifica storica di cattura, eliminazione, camera, cinematica; subordinata alle regole più recenti. `AGENTS.md` governa anteprime, approvazione e qualità.
- **PR #94 aperta alla stesura:** `scripts/sprite_postprocess.py` propone estrazione, allineamento globale, landmark, GIF diagnostiche e onion-skin. Non duplicare il tool o trattarlo come già disponibile in `main`; verificare PR e test prima di usarlo.

L'identità grafica della creatura è **Cerbero rosso/carnoso, tre teste anatomicamente collegate e rivolto a destra**, secondo i riferimenti canonici. Conservare proporzioni, palette, prospettiva e risoluzione effettivamente utilizzate dal gioco. **La vista laterale del ciclo di corsa è il riferimento**, non autorizza cambi di prospettiva nelle nuove pose.

## 2. Dinamica fisica e storyboard

L'attacco è **da dietro**, in corsa, verso la parte posteriore del veicolo. Nel sistema di schermo Cerbero è a sinistra e la preda a destra. Nessun salto acrobatico obbligatorio: privilegiare un'ultima spinta, estensione di collo/testa, chiusura delle fauci in movimento, frenata e scuotimento. Le altre due teste reagiscono con ritardo e attivano eventualmente il fuoco; non ripetono all'unisono la stessa posa.

| Fase | Evento osservabile | Contatto e dinamica |
| --- | --- | --- |
| A — Approach | Ultima falcata del galoppo, distanza che diminuisce | piedi/ponte, centro di massa avanza; può riusare un frame canonico |
| B — Reach | spinta posteriore, collo centrale esteso, mandibole aperte | bocca centrale cerca il retro della coupé; spinta e inerzia |
| C — Bite | mandibole si chiudono sul punto di presa, scossone del veicolo | anchor bocca ↔ anchor retro vincolati, senza slittamento |
| D — Brake | anteriori assorbono la frenata, busto si raccoglie | trasferimento del carico; non immobilizzare istantaneamente il corpo |
| E — Shake | collo e busto strattonano il veicolo; danno localizzato | mezzo ruota attorno alla presa; pezzi separati seguono inerzia e gravità |
| F — Release | fiammate delle bocche laterali, distruzione/rilascio e ripresa | fuoco emesso dalle bocche corrette, rottami cadono, poi riparte la corsa |

**Tempi:** creare una timeline parametrica, inizialmente intorno a 2–3 s solo come ipotesi da verificare in GIF alla scala del gioco. Non fissare FPS o durata irreversibilmente prima della prova. La cattura avviene solo per un giocatore già eliminato dal motore: l'animazione non decide né duplica eliminazioni.

**Vincolo meccanico:** prima dell'urto la carrozzeria è rigida, senza squash/stretch. Dopo l'urto sono possibili piegature **locali e permanenti**, fratture, pannelli e ruote distaccati. Cerbero non deve trascinare una macchina intera con una bocca che non la tocca. Se la scala non consente di inghiottire il veicolo senza un ridimensionamento artificiale, usare rottura in parti e sparizione soltanto dopo la distruzione visibile.

## 3. Inventario asset, nomi futuri e priorità

I percorsi seguenti sono **nomi previsti**, non file presenti. Ogni output deve conservare `source/` immutato, prompt effettivo in `prompts/`, eventuali `keyframes/`, `vehicles/`, `composites/`, `reports/` e manifest con hash, provenienza e stato di approvazione. Non aggiungere tutte le cartelle vuote in Git.

| ID | Percorso PNG previsto sotto `capture-v1/` | Priorità | Generazione o riuso | Scopo |
| --- | --- | --- | --- | --- |
| C-A | `keyframes/cerbero_A_approach.png` | P0 | riuso approvato dal ciclo di corsa; copia tracciata | raccordo al galoppo |
| C-B | `keyframes/cerbero_B_reach.png` | P0 | ImageGen, posa isolata | massima estensione, fauci aperte |
| C-C | `keyframes/cerbero_C_bite.png` | P0 | ImageGen, posa isolata | chiusura e primo contatto |
| C-D | `keyframes/cerbero_D_brake.png` | P1 | ImageGen, posa isolata | frenata e carico anteriori |
| C-E | `keyframes/cerbero_E_shake.png` | P1 | ImageGen, posa isolata | trazione e sollevamento |
| C-F | `keyframes/cerbero_F_release.png` | P2 | ImageGen se serve una nuova silhouette | rilascio, ritorno alla corsa |
| V0 | `vehicles/coupe/V0_intact.png` | P0 | ritaglio/copia del veicolo approvato | riferimento canonico, non redesign |
| V1 | `vehicles/coupe/V1_contact.png` | P0 | riuso V0 se possibile, altrimenti ritocco/generazione | contatto con retro non ancora deformato |
| V2 | `vehicles/coupe/V2_crumpled.png` | P1 | ImageGen/ritocco locale | danno permanente dopo il morso |
| V3 | `vehicles/coupe/V3_burning.png` | P2 | **preferire overlay di fuoco**, PNG solo se necessario | combustione senza ridisegnare ogni volta la carrozzeria |
| V4 | `vehicles/coupe/V4_wreck.png` | P2 | ImageGen/ritocco e separazione frammenti | relitto visibile, massa e caduta coerenti |
| X1 | `composites/X1_bite_contact.png` | P0 | composizione diagnostica di C-C e V1 | scala, bocca, occlusione e contatto |
| X2 | `composites/X2_shake_contact.png` | P1 | composizione diagnostica di C-E e V2 | verifica di trazione, profondità, danno |

**Quantità:** per lo storyboard completo fino a 5 nuove pose di Cerbero, 2–4 varianti utili della coupé e 2 compositi diagnostici. Tuttavia il primo *gate* richiede soltanto C-A esistente, C-B, C-C, V0 e X1; generare il resto **solo dopo** la verifica. Un composito è riferimento/QA, non l'asset fuso da mostrare in gioco. I veicoli restano layer distinti, così la sequenza di Cerbero viene riusata.

**Gli altri cinque veicoli:** chopper con pilota, pick-up, camion, fuoristrada e Ape riceveranno soltanto *anchor*, maschere e varianti danno proprie, dopo la coupé. Non rigenerare cinque volte gli stessi frame di Cerbero. Adeguare il punto di presa alla geometria e massa del mezzo: il camion può richiedere una soluzione di distruzione distinta se non è credibile nella bocca centrale.

## 4. Prompts proposti per il generatore (non ancora eseguiti)

Ogni chiamata è singola e isolata: **un file, un soggetto, una posa**, nessuno spritesheet automatico prima del gate. Allegare fisicamente in input le immagini canoniche A/B e, quando utile, il frame precedente approvato. Registrare il testo preciso usato *prima* di inviare il prompt. Il contesto non deve dipendere dalla memoria del generatore.

**Prefisso condiviso per C-B…C-F:**  
“Use the attached approved Hellscape Cerberus references as strict identity and visual-style references. Produce ONE isolated transparent RGBA game sprite, exact same three-headed red/fleshy Cerberus, side view facing right, same anatomical joints, proportions, lighting, palette, outlines and detail density as the approved source. One connected torso, four paws, three heads each attached to its own neck, one tail. No background, vehicle, text, UI, perspective change, detached parts, anatomy redesign, rubbery stretch, cropped extremities or sprite-sheet layout. Keep stable frame canvas and anatomical landmarks; make the requested pose a physically meaningful successive event.”

| ID | Specifica da aggiungere al prefisso |
| --- | --- |
| C-B | “Immediately before a capture: final propulsive gallop stride, hindlimbs driving backwards, shoulders advancing, central neck extended forward and down, central jaws wide open toward the rear of a vehicle that is NOT drawn. Other two necks naturally delayed; preserve bone lengths and joint connectivity.” |
| C-C | “Next event: central jaws closing around an invisible rigid rear bumper at the explicitly marked mouth contact point; body still carries forward momentum. Show credible jaw pivot, neck tension, staggered paws, no floating mouth or instant full-body stop. No vehicle in this isolated pose.” |
| C-D | “After first contact: forepaws land and brace, elbows flex to absorb deceleration, shoulders load, hindquarters continue a short inertial advance, central jaw remains clamped to same local anchor. Exactly three anatomically connected heads.” |
| C-E | “At peak tug: torso and central neck generate a short controlled upward-and-sideward yank; front limbs support the weight, center of mass remains plausible, jaw grip unchanged. Side heads follow with delayed reaction; no independent disembodied head movement.” |
| C-F | “After release: central jaws reopen, neck retracts into the ordinary gallop silhouette, legs find the next running support; match the approved approach key pose and direction. Fire belongs in separate effect layers, not painted permanently over this body.” |

**Prompt V1 (se necessario):** “Preserve the supplied approved side-view Hellscape coupé vehicle exactly in design, wheel count, proportions, rust/spikes, palette and pixel detail. One transparent isolated PNG, same camera and facing right. Add only the tiny localized rear contact compression needed for a large bite; no global stretching or recoloring.”

**Prompt V2:** “Same canonical Hellscape coupé, same scale and side view, one transparent PNG. Rear bodywork visibly and permanently crumpled at the marked impact point; wheels, chassis and recognizable front cabin preserve their structure except mechanically justified local damage. No fire, gore or Cerberus. No extra wheels or changed car model.”

**Prompt V4:** “Use the approved coupé and V2 as strict identity references. One transparent PNG of the same destroyed vehicle after a powerful bite and pulling load: fractured metal panels and recognizable rigid fragments at plausible positions, no floating tires, gravity and mass plausible. Keep the final relative scale and perspective. Separate breakaway fragments into tracked layers in postproduction.”

**Prompt dei compositi X1/X2:** “Technical contact-check composition of the attached, already approved transparent Cerberus and coupé poses. Keep both original layer pixels, scale and colors unchanged. Cerberus is left of the coupé and faces right. Align the central mouth anchor with the specified rear-body anchor; show physically correct front/back occlusion. No repainting, relighting or redesign. Output for QA only, not a replacement merged sprite.”  
**Nota:** per X1/X2 è **preferibile una composizione deterministica via script**, senza ImageGen. Se il generatore modifica i pixel, non usare il composito come master.

## 5. Metadati obbligatori e compositing

- Registrare per ogni posa: `canvas_width`, `canvas_height`, vista, verso, centro toracico, piedi/supporti, per ciascuna testa `neck_joint`, `jaw_pivot`, `mouth_anchor`, `muzzle_axis`; per la coupé `bite_anchor_rear`, per i frammenti `fragment_origin` e `mass_class`. Coordinate nello stesso sistema di riferimento con trasformazioni dichiarate.
- Durante la presa (da C a E), applicare `T_vehicle(t) · p_bite_rear = T_cerberus(t) · p_mouth_center`. Se un anchor è coperto dall'immagine, usarne comunque la posizione annotata; non sostituirlo con un punto inventato ogni fotogramma.
- Separare layer davanti/dietro mandibole e carrozzeria; usare maschere di occlusione e *rigid transforms* sul veicolo. Una sola trasformazione di corpo non deve correggere errori anatomici di testa/zampe. Regolare camera e moto relativo indipendentemente dalla texture del ponte.
- Separare fiamme, scintille, polvere e rottami. Le fiammate partono dalle rispettive bocche laterali e seguono asse muso e testa. Il fuoco NON nasce dal veicolo o dal naso per errore.
- Mantenere i PNG originali immutati con SHA-256; ogni correzione è un derivato versionato e reversibile. Output diagnostici temporanei in `artifacts/`, non nel gioco e non versionati salvo evidenze canoniche.
- Non usare una GIF di postprocessing come prova di integrazione: la verifica del gioco richiede registrazione dal browser della medesima revisione.

## 6. Pipeline incrementale con gate

1. **Audit** — ricontrollare camera e scale del renderer, reference approvati, collisioni, formato di atlas e lo stato di PR #92/#94. Preparare la scheda di contestualizzazione prescritta dal protocollo.
2. **Gate 1: presa** — C-A (riuso), C-B e C-C, V0, anchor C e X1. Approvazione visiva: tre teste, anatomia, punto di morso, identità della coupé, dimensioni in gioco. Se B e C non definiscono il movimento, generare M fra loro e approvarlo; non produrre un'intera tavola prematuramente.
3. **Gate 2: frenata/strappo** — C-D, C-E e V2, X2. Verificare sostegni anteriori, spostamento del baricentro, inerzia, tensione della presa, deformazione locale.
4. **Gate 3: distruzione** — C-F, V4, eventuali V1/V3 realmente necessari; animare separatamente fuoco e frammenti.
5. **Postprocess** — estrazione, trasparenze, registrazione globale da landmarks, controlli antitremolio, palette, maschere e contatto. Preferire lo strumento della PR #94 una volta approvato/mergiato; non introdurre una seconda pipeline.
6. **Spritesheet ed esecuzione** — generare atlante e intervalli; animazione a tempo/distanza del movimento, clock condiviso, aggancio veicolo; conservare stato partita e pause.
7. **QA e consegna** — GIF reali dal browser della cutscene (non HTML o GIF diagnostica spacciata per gioco), screenshot statici pertinenti, test di contatto/trasformazioni/eventi/riduzione movimento, CI e approvazione esplicita prima del merge. Mai assumere integrazione solo perché il file PNG esiste.

**Gate di rifiuto:** testa scollegata, ruote mutate senza danno, morso senza contatto, artefatti cromatici evidenti, trasformazioni che deformano intero veicolo, dettagli identitari persi, fiamme fuori dalla bocca, teletrasporto del mezzo, scomparsa prima della distruzione.

## 7. Evoluzione proposta del postprocessing (non implementata qui)

La PR #94 copre già l'**allineamento globale** e l'ispezione. Per ridurre le chiamate a ImageGen, estendere **in fasi** la stessa CLI:

| Passo | Automazione sicura | Limite / supervisione |
| --- | --- | --- |
| P1 | palette matching su regioni stabili, normalizzazione alfa, crop/padding trasparente, uniformità canvas | confronto con colore approvato; non alterare materiale/luce intenzionale |
| P2 | overlay/onion-skin con heatmap, landmark residui, controllo arti/teste/ruote e maschere separate | warning automatici, non certificazioni anatomiche |
| P3 | editor parametrico di correzioni locali: trasla/ruota parti **rigide** ai pivot validati, maschera/clona texture su zone circoscritte, preserva originale | non applicare warp ad ossa, teschi, metallo; ricostruire ciò che è nascosto richiede una sorgente |
| P4 | contatto: visualizza anchors bocca-veicolo, residuale per fotogramma, locking dell'aggancio e ordine dei layer | non inventare un morso corretto se la silhouette manca |
| P5 | esportazione atlante/GIF/report e suite di test su hash, qualità, errori di bordo e stabilità dei contatti | browser/utente convalida l'effetto a scala reale |

**Decisore “postprocess vs ImageGen”:** se l'errore è posizione, dimensione, palette, alfa, occlusione controllata o piccolo difetto pittorico su una regione già esistente, preferire postprocessing reversibile. Se mancano articolazioni, superfici, una vista corretta o una posa anatomicamente possibile, richiedere nuovo disegno/generazione. Nessun software geometrico può ricostruire in modo affidabile dettagli mancanti senza una fonte.

**Ambito di questa PR:** soltanto questo piano versionato. Nessun codice, nuova immagine, modifica al gioco, merge, o approvazione estetica implicita.

## Registro delle revisioni

- **v1.0.0 — 2026-10-31:** primo storyboard e inventario puntuale, prompt proposti per ogni asset, gate di validazione, contratto degli anchor e roadmap del postprocessing collegata alla PR #94.
