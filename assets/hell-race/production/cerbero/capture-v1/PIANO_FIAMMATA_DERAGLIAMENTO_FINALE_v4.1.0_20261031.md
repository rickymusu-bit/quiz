# Hellscape — piano animazioni Cerbero, deragliamento e finale davanti alle macerie

**Versione:** 4.1.0 · **Data:** 31 ottobre 2026 (Europe/Rome)  
**Stato:** piano approvato nella direzione narrativa dall'utente; animazioni dei veicoli e nuova fiammata da produrre e validare, nessuna modifica runtime.  
**Fonte:** richieste dell'utente: attacco incendiario a distanza e sei deragliamenti specifici; finale con Cerbero che si arresta davanti alle macerie del portale, alza la testa, rugisce e lancia una fiammata verso l'alto.  
**Precedenti:** [piano v4.0.0](PIANO_FIAMMATA_DERAGLIAMENTO_v4.0.0_20261031.md) e [piano v3.0.0](PIANO_CATTURA_SPINTA_LAVA_v3.0.0_20261031.md), mantenuti come revisioni precedenti.  
**Regole:** [AGENTS.md](../../../../../AGENTS.md), [protocollo sprite v16](../../../../../docs/PROTOCOLLO_SPRITE_ANIMATI_v16.0.0_20261031.md).

## Nuova sequenza di eliminazione

1. **Corsa:** Cerbero insegue a distanza, senza raggiungere fisicamente il veicolo perdente.
2. **Fiammata:** Cerbero, continuando a correre, apre le bocche appropriate e sputa fuoco verso il bersaglio. Origine dei getti ancorata alle bocche; nessuna auto nell'animazione del mostro.
3. **Trasferimento del fuoco:** un VFX separato rappresenta il getto dalla posizione delle bocche alla posizione del mezzo; accensione solo dopo l'impatto visibile.
4. **Veicolo incendiato:** la carrozzeria prende fuoco mentre il veicolo mantiene inizialmente la propria velocità. Nessun rallentamento narrativo deliberato.
5. **Perdita di controllo e deragliamento:** il singolo mezzo devia, supera il bordo realmente accessibile del ponte ed esce dalla carreggiata. La deviazione e l'eventuale ribaltamento dipendono dal tipo di veicolo, non da una generica traslazione del sprite.
6. **Caduta e lava:** mantenere traiettoria, orientamento, profondità, gravità e occlusioni; mostrare contatto e conseguenze dell'impatto nella lava.
7. **Ripresa della corsa:** Cerbero prosegue senza contatto, recupero del distacco o animazione di spinta.

**Esclusioni esplicite:** non produrre animazioni di rallentamento per consentire a Cerbero di raggiungere il bersaglio, avvicinamento per la cattura, urto spalla-fiancata, spinte, morso, presa o lancio fisico. Il risultato rimane una rappresentazione dell'eliminazione già determinata dal motore di gioco: nessuna modifica a turni, punteggi o vite.

## Pacchetti di produzione indipendenti

| ID | Animazione / effetto | Varianti | Note |
| --- | --- | ---: | --- |
| C-RUN | Corsa Cerbero | 1 | Riutilizzabile; ciclo visivo nuovo da approvare |
| C-FIRE | Cerbero sputa fuoco | 1 | Personaggio isolato, senza auto, conserva corsa e identità |
| V-FIRE | Getto, propagazione e impatto | 1 set modulare | Ancoraggi alla bocca e al bersaglio; direzione coerente |
| CAR-CHOPPER | Chopper incendiato, sbandata e caduta | 1 | Moto/pilota, appoggi e ribaltamento specifici |
| CAR-PICKUP | Pick-up incendiato, sbandata e caduta | 1 | Ingombro, ruote, massa e asset originali |
| CAR-TRUCK | Camion incendiato, sbandata e caduta | 1 | Inerzia e ribaltamento differenti da mezzi leggeri |
| CAR-COUPE | Coupé incendiata, sbandata e caduta | 1 | Altezza e dinamica della vettura |
| CAR-OFFROAD | Fuoristrada incendiato, sbandata e caduta | 1 | Assetto alto e sospensioni |
| CAR-APE | Ape tre ruote incendiata, sbandata e caduta | 1 | Stabilità e rotazione specifiche delle tre ruote |
| LAVA | Impatto, spruzzi e affondamento | 1 set modulare | Sincronizzato alla traiettoria di ciascun mezzo |
| C-END-STOP | Raccordo corsa → arresto davanti alle macerie | 1 | Cerbero non deve attraversare le macerie |
| C-END-ROAR | Testa sollevata e ruggito | 1 | Animazione dedicata, Cerbero fermo, anatomia invariata |
| C-END-UPFIRE | Fiammata verticale finale | 1 | Effetto diretto verso l'alto, separato dalla fiammata orizzontale di cattura |

**Totale produttivo:** una corsa Cerbero, una preparazione/fiammata di cattura, un set di getti/impatto, **sei sequenze veicolo distinte**, un set lava e **tre fasi finali distinte** (arresto, ruggito, fiammata verso l'alto), combinabili in un'unica clip se la generazione conserva coerenza e facilita l'estrazione dei frame. Il VFX di fiamme aderenti può essere riutilizzato, ma la traiettoria di deragliamento e la caduta devono essere verificate individualmente per tutti e sei i modelli.

## Finale vittorioso — macerie, ruggito e fiammata verso il cielo

La [specifica di portale v1.3.0](../../../../../docs/HELLSCAPE_CORREZIONI_CODEX_v1.3.0.md) prevale sulla vecchia cinematica del portale che emerge o sprofonda nella lava.

1. **Arrivo dall'alto:** il portale cade dall'alto, si incastra nel ponte e provoca crepe e detriti; mantiene la prospettiva approvata.
2. **Fuga:** il mezzo vincitore attraversa il portale guidando in avanti, senza fermarsi né essere raggiunto.
3. **Autodistruzione:** *dopo* l'attraversamento completo, il portale crolla in blocchi di pietra e macerie permanenti sul ponte. Non sprofonda nella lava.
4. **Cerbero si arresta:** raggiunge la zona del portale ma si ferma **davanti alle macerie**, senza attraversarle o passarci dentro. Raccordo corsa → frenata → fermo con peso e appoggi leggibili.
5. **Testa al cielo e ruggito:** solleva la testa principale verso l'alto, mantenendo colli e altre teste coerenti con l'anatomia del riferimento effettivamente scelto. Rugge con apertura naturale delle fauci.
6. **Fiammata di rabbia verso l'alto:** dalla bocca orientata verso il cielo parte una fiammata ascendente. Il getto non attraversa il corpo, non è diretto ai veicoli e non danneggia le macerie. Il fuoco può uscire dall'inquadratura; la parte estesa si gestisce come VFX separato, ancorato alla bocca e sincronizzato al ruggito.
7. **Chiusura:** termina il getto e si mostra la conclusione con `VITTORIA` e il nome effettivo del vincitore, dopo il gesto finale, senza sovrapporre anticipatamente il titolo.

Questa coreografia **sostituisce** la precedente reazione con tre pugni/colpi al suolo e l'eventuale fiammata orizzontale del vecchio finale. Non generare salti, colpi contro il portale o una nuova distruzione del ponte da parte di Cerbero. Durante il finale la creatura **è ferma**, diversamente dall'attacco ai veicoli nel quale continua il galoppo.

**Produzione modulare suggerita:** usare un video continuo soltanto per arresto, sollevamento della testa e ruggito, con eventuale incandescenza confinata agli occhi/bocca; realizzare il getto verticale come effetto separato per non troncarlo o deformare la creatura. Le decisioni estetiche sulla carica incandescente sono tecniche, non nuovi vincoli creativi approvati. Conservare camera, scala e orientamento coerenti con la scena reale.

## Riferimenti e loro stato

- Per l'identità approvata nel repository rimane [Cerbero proliferante 1.0.5](../proliferating-reference-v1/README.md); il ciclo storico a tre teste non si deve imporre al modello nuovo.
- L'utente ha accettato in conversazione una possibile divergenza dal design originale e ha proposto un **nuovo reference da Gemini**, estratto dal video `855.mp4`, con il frame 100 preferito. La sua esistenza nella conversazione **non equivale** ad archiviazione o approvazione formale di un nuovo asset nel repository. Prima della produzione, importare il PNG effettivo e registrarne percorso, revisione e hash; evitare di dichiarare sostituito `reference.png` senza questa verifica.
- Verificare che ogni generatore riceva davvero i PNG indispensabili (protocollo v16, §2.1.3); non presumere accesso implicito al repository o alla conversazione.
- Non generare effetti di fuoco che partano da bocche non esistenti o attraversino altre teste; mantenere connessioni, massa, silhouette e materiale.

## Regia e sincronizzazione

- Separare **animazione Cerbero**, **getto di fuoco**, **veicolo e incendio**, **traiettoria di uscita** e **VFX lava**. Il fuoco aderente può essere compositato sul mezzo; non occorre generare Cerbero + auto nella stessa clip.
- Evento di lancio: posizione delle bocche in coordinate scena. Evento di impatto: il getto raggiunge il bersaglio; solo allora iniziano fiamme sul mezzo e perdita di controllo.
- Non introdurre rallentamento artificiale. La velocità iniziale del veicolo rimane coerente con la corsa; la direzione cambia per sbandata. Le variazioni di velocità dovute a rotazione, perdita di appoggio e gravità durante la caduta non costituiscono la vecchia fase di rallentamento.
- Il ponte e i parapetti sono geometria solida: identificare un'uscita praticabile o progettare un cedimento esplicito sottoposto ad approvazione; non far attraversare magicamente barriere o pavimentazione.
- Riprodurre in modo coerente prospettiva, profondità e occlusione per ogni mezzo; nessun teletrasporto, salto di scala o uscita dalla scena per nascondere la caduta.
- Animazioni e VFX seguono il tempo attivo, pausa/ripresa e preferenza per movimento ridotto come nella scena esistente.
- Tempi e numero di fotogrammi si determinano dopo prove visive, non sono fissati da questo documento.

## Ordine di lavoro e gate

1. **Riferimenti:** registrare il nuovo frame Gemini scelto, se confermato, e le sorgenti canoniche dei sei veicoli. Esaminare le immagini reali e annotare ancoraggi e scala.
2. **Cerbero:** validare corsa; produrre **solo Cerbero che sputa fuoco** e il raccordo con la corsa, senza veicolo.
3. **Effetto:** produrre getto e impatto separati; verificare che la fiamma parta dalle bocche e raggiunga il bersaglio reale.
4. **Veicolo pilota:** partire dalla coupé o dal mezzo più semplice per convalidare incendio, sbandata, bordo, caduta e impatto.
5. **Varianti:** produrre e verificare individualmente chopper, pick-up, camion, fuoristrada e Ape; nessun semplice recolor o riuso cieco della medesima traiettoria.
6. **Composizione:** sincronizzare le parti nella scena reale, con tutti i sei veicoli e le occlusioni del ponte.
7. **Finale:** verificare portale dall'alto, attraversamento completo, crollo in macerie e solo dopo arresto, testa sollevata, ruggito e fiammata ascendente di Cerbero.
8. **QA:** controllare coerenza anatomica e rigidezza veicoli, punti di contatto, velocità, gravità, sbandata, margini, transizioni, timing e scala in desktop/mobile. Eseguire i test pertinenti; fornire registrazioni reali del browser, non GIF generate dalle sole immagini.
9. **Approvazione:** non sostituire asset approvati, modificare runtime o fare merge senza approvazione esplicita e controlli applicabili.

## Registro delle modifiche

**4.1.0 — 2026-10-31:** definisce il finale attuale: portale dall'alto, attraversamento, autodistruzione in macerie, Cerbero si ferma davanti ai resti, alza la testa, rugge e lancia una fiammata verso l'alto; rimuove dal piano di produzione la vecchia reazione con tre pugni al suolo. Aggiunge raccordo di arresto, ruggito e VFX ascendente. Nessuna modifica al gioco o agli asset.


**4.0.0 — 2026-10-31:** introduce incendio a distanza seguito direttamente da perdita di controllo, deragliamento e caduta nella lava; elimina rallentamento, recupero distacco, urto e spinta. Formalizza sei sequenze distinte, una per ciascun veicolo; separa Cerbero, fuoco, veicolo e lava. Documenta la candidatura del reference Gemini senza dichiararlo già importato o approvato nel repository. La versione 3.0.0 rimane archivio storico.
