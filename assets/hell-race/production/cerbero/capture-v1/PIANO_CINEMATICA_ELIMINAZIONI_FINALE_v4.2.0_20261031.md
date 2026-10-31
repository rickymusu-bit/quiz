# Hellscape — Cinematica di Cerbero: eliminazioni e vittoria

**Versione:** 4.2.0 · **Data:** 31 ottobre 2026 (Europe/Rome)  
**Stato:** piano narrativo e regia **definiti dall'utente**; parametri numerici e qualità dell'animazione da tarare in prova. **Solo documentazione**: nessun asset, codice, evento runtime o test visivo modificato/validato in questa revisione.  
**Precedente:** [v4.1.0](PIANO_FIAMMATA_DERAGLIAMENTO_FINALE_v4.1.0_20261031.md); il piano v4.0.0 è conservato nella cronologia Git.  
**Norme:** [AGENTS.md](../../../../../AGENTS.md), [protocollo sprite v16](../../../../../docs/PROTOCOLLO_SPRITE_ANIMATI_v16.0.0_20261031.md), [specifica del portale](../../../../../docs/HELLSCAPE_CORREZIONI_CODEX_v1.3.0.md).

> **Precedenza:** le decisioni dell'utente del 31/10/2026 qui riportate sostituiscono i precedenti piani di cattura (morso, presa, spinta o contatto), i finali con portale che emerge dalla lava e la precedente v4.1.0 dove escludeva l'avvicinamento di Cerbero prima della fiammata.

## 1. Regia generale

- **Due cinematiche riutilizzabili:** (A) una eliminazione per ciascun giocatore perdente; (B) il finale del vincitore.
- **Un'unica ripresa continua per ogni sequenza:** telecamera virtuale in movimento fluido; niente tagli, teletrasporti, variazioni brusche di scala o cambi improvvisi di posa.
- **Coordinate del mondo distinte dalle coordinate dello schermo:** spostare i soggetti realmente nella scena; la telecamera li inquadra, non ne sostituisce la fisica con traslazioni di sprite.
- **Movimento sempre credibile:** ciclo di galoppo e tempi di appoggio del Cerbero coerenti con velocità e distanza percorsa; ponte e lava mantengono prospettiva/occlusioni; le sagome dei veicoli restano rigide.
- **Separazione degli asset e responsabilità:** animazione Cerbero, getto di fuoco, incendio aderente al veicolo, traiettoria del veicolo, caduta/effetto lava e animazione del portale sono livelli separati sincronizzati dal motore.
- **Evento cinematografico, non regola di gameplay:** l'eliminazione e la vittoria sono già decise dal motore; nessun cambio a turni, vite, punti, Omen o salvataggi. Tutto rispetta pausa/ripresa e tempo attivo.

## 2. Eliminazione: coreografia vincolante

La sequenza **si ripete per ogni giocatore eliminato**, con gli stessi eventi e le varianti grafiche/inerziali del mezzo selezionato.

| Stato | Evento visibile | Condizione per procedere |
| --- | --- | --- |
| E0 — Isolamento | **Tutti i superstiti accelerano ed escono dall'inquadratura**, rimanendo in gara. La camera segue il veicolo perdente e Cerbero e li tiene entrambi visibili. | Superstiti effettivamente fuori campo; perdente e Cerbero inquadrati. |
| E1 — Recupero | Cerbero continua il galoppo e **si avvicina al perdente** fino alla distanza d'attacco; il perdente mantiene inizialmente l'andatura di fuga, senza un rallentamento artificiale imposto per farsi raggiungere. | Distanza d'attacco raggiunta. |
| E2 — Carica e fiammata | Cerbero mantiene il galoppo, orienta le bocche/mascelle effettivamente presenti nel riferimento canonico, mostra incandescenza e **sputa fuoco a distanza** verso il veicolo. | Impatto del getto visibile sul mezzo. |
| E3 — Incendio e sbandata | **Solo dopo l'impatto** il veicolo si incendia, continua ad avanzare e **sbanda lateralmente** verso un bordo praticabile del ponte. Non compie un testacoda. | Veicolo oltre il bordo e senza appoggio. |
| E4 — Precipitazione | Il veicolo ancora in fiamme **cade fuori dal ponte nella lava** con traiettoria, gravità, profondità, occlusioni e impatto visibile. Cerbero rimane sulla carreggiata. | Impatto nella lava completato. |
| E5 — Raccordo | Cerbero riprende/continua la corsa verso gli altri partecipanti; la telecamera rientra progressivamente nella composizione normale di inseguimento. | Inquadratura di gioco ristabilita. |

### 2.1 Distanza d'attacco

- **Valore iniziale da tarare: circa 3 lunghezze del veicolo perdente**, misurate lungo l'asse di avanzamento nello spazio di gioco, tra la parte anteriore del Cerbero e il retro del mezzo; non in pixel dello schermo. È una **proposta di calibrazione accettata**, non una misura fisica definitiva.
- Al raggiungimento della distanza Cerbero **non si arresta**: regola il passo per restare a portata durante la preparazione/erogazione del fuoco.
- Se la fuga e l'avvicinamento richiedono durate differenti in funzione del veicolo o della scena, gli eventi restano vincolati alle distanze reali, non esclusivamente a secondi fissi.

### 2.2 Traiettoria del perdente

1. Avanzamento dopo l'impatto della fiammata, con incendio visibile che segue la carrozzeria.
2. **Deriva laterale progressiva** verso il bordo scelto: l'orientamento del mezzo rimane sostanzialmente rivolto in avanti. Escludere testacoda e rotazioni arbitrarie sul ponte.
3. Superamento del bordo **realmente libero** della carreggiata. Non attraversare ringhiere, pilastri o geometria solida; se il layout impedisce l'uscita, correggere traiettoria/area di uscita nel livello senza introdurre cedimenti non approvati.
4. Caduta libera con la normale componente in avanti e una componente laterale; la rotazione **dopo aver lasciato il ponte**, se necessaria per credibilità, è conseguenza dinamica del distacco, non un testacoda introdotto come variante narrativa.
5. Contatto con la superficie della lava, effetto d'impatto e conclusione dell'evento.

Tutti e sei i mezzi richiedono un controllo dedicato di sagoma, inerzia, baricentro, ruote/appoggi e punto d'uscita: **chopper con pilota, pick-up, camion, coupé, fuoristrada, Ape a tre ruote**. La sbandata laterale è la regola comune, **non** una selezione casuale tra sbandata, testacoda e incidente alternativo. La variazione riguarda soltanto la risposta fisica credibile di ciascun veicolo.

### 2.3 Telecamera: scelta confermata

- **Camera a inseguimento condiviso:** mantiene **sempre visibili Cerbero e veicolo perdente** durante la fase di eliminazione; non segue soltanto Cerbero, non rimane fissa sul ponte.
- Durante E0 la camera ricalibra l'area utile per consentire ai superstiti di accelerare fino a uscire dal quadro senza scomparire artificialmente.
- Durante E1–E2 inquadra il punto intermedio fra i soggetti con margini di sicurezza; usa interpolazione morbida di posizione e zoom, con un lieve assestamento durante l'attacco, non uno stacco.
- Durante E3 accompagna la deriva laterale; durante E4 **allarga e abbassa progressivamente l'inquadratura** in modo che il Cerbero sul ponte e il veicolo in caduta restino entrambi in campo fino all'impatto. Se la profondità rende impossibile un campo leggibile, ridurre il livello di zoom o adeguare il framing, **non tagliare la caduta**.
- Dopo E4 effettua un raccordo continuo con la camera dell'inseguimento. La regola che impone entrambi visibili vale per l'intera eliminazione, inclusa la caduta.

### 2.4 Timeline di lavoro — indicativa, non definitiva

| Tempo di anteprima | Beat |
| --- | --- |
| 0,0–1,5 s | Superstiti in fuga, isolamento di Cerbero e perdente |
| 1,5–3,0 s | Recupero di Cerbero fino alla distanza d'attacco |
| 3,0–4,5 s | Incandescenza, emissione del fuoco, impatto |
| 4,5–7,0 s | Incendio e sbandata laterale |
| 7,0–9,0 s | Uscita dal ponte, caduta e contatto con la lava |
| 9,0–10,0 s | Raccordo di camera e ritorno all'inseguimento |

Questi **circa 10 secondi** sono un riferimento per lo storyboard, **non** un requisito rigido: in produzione ogni beat parte al completamento dell'evento precedente. Adeguare accelerazioni, distanze e velocità alla scala effettiva del gioco, evitando sequenze a tempo che anticipino l'impatto.

## 3. Vittoria: coreografia vincolante

| Stato | Evento visibile | Condizione per procedere |
| --- | --- | --- |
| F0 — Distacco | **Il vincitore accelera e si lascia Cerbero alle spalle**, fino a farlo sparire completamente dall'inquadratura. | Cerbero fuori quadro; vincitore visibile. |
| F1 — Portale dall'alto | **Solo quando il vincitore è solo in campo**, il portale comincia a cadere **dall'alto** davanti al veicolo. Deve raggiungere una posizione fisicamente attraversabile sul ponte, secondo la prospettiva del livello. | Portale raggiunge la posizione attraversabile; il vincitore gli si avvicina. |
| F2 — Ritorno di Cerbero | **Poco prima che il vincitore attraversi il portale**, Cerbero ricompare nell'inquadratura, correndo dietro al veicolo: non prima, durante la discesa iniziale. | Cerbero nuovamente visibile; veicolo al varco. |
| F3 — Attraversamento | Il vincitore **attraversa completamente** il portale continuando a guidare. Cerbero è ancora alle sue spalle e non riesce a raggiungerlo. | Ingombro intero del veicolo oltre il piano del portale. |
| F4 — Autodistruzione | **Solo dopo il passaggio completo** il portale crolla in **macerie solide e permanenti** sul ponte; niente affondamento nella lava. | Crollo concluso, ostacolo visibile. |
| F5 — Corsa verso le macerie | Cerbero corre verso i resti, decelera e **si ferma davanti alle macerie**, senza attraversarle e senza colpirle. | Arresto completo con appoggi stabili. |
| F6 — Rabbia | Cerbero **alza la testa/le teste secondo l'anatomia effettiva**, guarda verso l'alto e **ruggisce**. | Ruggito completato o raccordato con la preparazione del fuoco. |
| F7 — Fiammata finale | Cerbero **sputa una fiammata verso il cielo**, ancorata alla/e bocca/bocche orientate in alto, senza indirizzarla ai veicoli o alle macerie. | Getto terminato; segue schermata di vittoria. |

### 3.1 Regia del finale

- F0: telecamera segue il vincitore; Cerbero esce **dietro**, non svanisce.
- F1: camera mantiene il vincitore come soggetto principale e lascia spazio sopra/davanti al percorso per la caduta leggibile del portale.
- F2–F3: ampliare progressivamente il campo quanto basta per mostrare **Cerbero che rientra** e il vincitore che attraversa. Non anticipare il ritorno di Cerbero durante la discesa iniziale.
- F4–F5: spostare gradualmente il fuoco della composizione sul crollo e su Cerbero in arrivo; conservare continuità di ponte, prospettiva, scala e macerie.
- F6–F7: inquadratura finale sufficientemente ampia da leggere testa sollevata e fiammata ascendente; il getto può estendersi oltre il limite superiore dello schermo senza troncare la creatura.
- Solo dopo il gesto conclusivo appare il titolo **VITTORIA** con il vincitore effettivo; non introdurlo durante la discesa o l'attraversamento.

**Non riutilizzare** finali obsoleti: portale che sale dalla lava, portale che sprofonda, Cerbero che colpisce il suolo con tre pugni, che distrugge il ponte o che attraversa le macerie.

## 4. Pacchetti di produzione e raccordi

| Componente | Funzione |
| --- | --- |
| C-RUN | Galoppo ciclico e corsa a velocità variabile, agganciata alla distanza percorsa |
| C-APPROACH | Recupero in corsa fino alla distanza di circa 3 lunghezze del veicolo |
| C-CHARGE | Incandescenza di occhi/fauci esistenti e orientamento verso il perdente |
| C-FIRE-FWD + VFX-FWD | Fiammata in avanti con origine anatomica delle bocche e impatto sul veicolo |
| CAR-FIRE | Incendio aderente alla carrozzeria per i sei modelli |
| CAR-SKID-FALL | Sei sequenze specifiche di **sbandata laterale → bordo → caduta** |
| VFX-LAVA | Impatto nella lava e relativi effetti, sincronizzati |
| C-RETURN | Raccordo continuo alla corsa/inseguimento dopo l'eliminazione |
| PORTAL-DROP + COLLAPSE | Caduta dall'alto, attraversamento, macerie permanenti |
| C-FINAL-REENTRY | Rientro in campo di Cerbero poco prima dell'attraversamento |
| C-FINAL-STOP | Corsa verso le macerie, decelerazione, arresto senza compenetrazioni |
| C-FINAL-ROAR | Sollevamento della testa e ruggito verso l'alto |
| C-FIRE-UP + VFX-UP | Fiammata ascendente distinta da quella di eliminazione |

Animazioni e VFX possono essere estratti da clip più lunghe **solo se** consentono raccordi riutilizzabili e sincronizzazione precisa. Un filmato unico a tempi fissi **non** è la logica del gioco: gli eventi devono poter partire quando terminano quelli precedenti.

## 5. Identità visiva e ancoraggi

- Il modello di riferimento attualmente archiviato è [Cerbero proliferante 1.0.5](../proliferating-reference-v1/README.md). Il numero effettivo delle teste e l'anatomia delle bocche devono derivare dal PNG canonico approvato, **non** essere forzati al vecchio modello storico a tre teste.
- Un reference da video Gemini (frame 100 di `855.mp4`) è stato discusso ma non risulta approvato come asset canonico in questo fascicolo: prima di usarlo, importare il PNG effettivo con provenienza e hash verificati.
- Le nuove pose devono conservare silhouette, massa, connessioni anatomiche e materiali. Non deformare artificialmente colli, teste, zampe o oggetti rigidi per far coincidere l'animazione.
- Ogni getto parte dalle coordinate della bocca effettiva, ruota con l'orientamento di quella testa e raggiunge un bersaglio valido; effetti del fuoco separati dal corpo.
- La scena dev'essere presentata con screenshot/registrazioni **reali del browser**, non con HTML embedded o GIF di sprite usate come se documentassero il runtime.

## 6. Collaudo e condizioni di accettazione

1. **Ripetizione:** 0, 1, 2 o più eliminazioni consecutive; ogni volta superstiti fuori campo, Cerbero/perdente insieme, ripresa corretta e nessuna riapparizione di eliminati.
2. **Camera:** per ogni eliminazione perdente e Cerbero rimangono visibili anche durante la caduta; nessun taglio, jump di zoom, scala o posizione.
3. **Contatto fuoco:** niente incendio prima che il getto raggiunga il mezzo; nessun contatto, morso, spinta o collisione Cerbero–veicolo.
4. **Sei veicoli:** sbandata laterale, bordo praticabile, caduta con gravità e impatto lava per ciascuno; **nessun testacoda** sul ponte.
5. **Finale:** vincitore solo → avvio discesa del portale → ricomparsa tardiva di Cerbero → attraversamento completo → crollo → Cerbero alle macerie → arresto → ruggito → fiammata verticale.
6. **Tempi e condizioni:** comportamento consistente a 30/60/144 FPS dove pertinenti; pausa/ripresa senza duplicare eventi, sincronizzazione del mondo con la camera e supporto al movimento ridotto.
7. **Layout:** verificare desktop, mobile verticale/orizzontale, diverse risoluzioni/DPR, profondità/occlusioni e limiti del ponte.
8. **Invarianza gameplay:** punteggi, vite, regole dei turni, stato persistente, vincitore e ordine degli eliminati immutati.

**Punti ancora da tarare nelle prove (non decisioni narrative aperte):** velocità e accelerazioni, curve di easing della camera, intensità dello zoom, esatta distanza di attacco attorno a 3 lunghezze, durata dei singoli beat (timeline provvisoria), portata/volumetria delle fiammate e ampiezza del campo finale. Prima di implementare o sostituire asset servono approvazione delle nuove pose, prove runtime e revisione della PR. **Non eseguire merge senza autorizzazione esplicita.**

## Registro modifiche

- **4.2.0 — 2026-10-31:** converte il piano in una specifica cinematografica completa: accelerazione dei superstiti fuori quadro, telecamera che mantiene in campo Cerbero e perdente, avvicinamento fino a circa tre lunghezze del veicolo, fiammata e sbandata **solo laterale** con caduta nella lava. Precisa il finale: distacco del vincitore che lascia Cerbero fuori campo; portale che inizia a cadere solo quando il vincitore è solo; **rientro tardivo** di Cerbero poco prima dell'attraversamento; attraversamento completo, macerie, corsa di Cerbero fino ai resti, arresto, ruggito e fuoco in alto. Tempi iniziali indicativi; nessuna modifica runtime.
- **4.1.0 — 2026-10-31:** aggiunge arresto di Cerbero, ruggito e fiammata verticale alle macerie; non specificava la regia camera né il distacco/ritorno del mostro ed escludeva l'avvicinamento prima della fiammata.
- **4.0.0 — 2026-10-31:** sostituisce la presa con incendio a distanza e caduta; introduce sei sequenze separate per i veicoli.
