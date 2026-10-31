# Cerbero — cattura, checkpoint C-B

**Versione:** 1.0.1 · **Data:** 31 ottobre 2026, Europe/Rome. Timestamp preciso in `manifest.json`.
**Stato corrente:** C-B 1.0.0 respinta dall’utente per riordino delle teste; retake 1.0.1 in preparazione, con tutte le teste protese e ordine anatomico preservato. C-C non prodotta; cattura completa e integrazione non completate. PR in bozza: https://github.com/rickymusu-bit/quiz/pull/103.

Applicati `AGENTS.md` e `docs/PROTOCOLLO_SPRITE_ANIMATI_v16.0.0_20261031.md`. La richiesta corrente seleziona esclusivamente `../run-stabilized-v1/frames/008.png` come riferimento indispensabile, superando per questo checkpoint le precedenti proposte multiposa/multiriferimento. I documenti precedenti restano storici, non prompt eseguiti. La corsa è approvata come asset; 008 non viene automaticamente approvato come raccordo definitivo C-A.

Il PNG canonico resta al suo percorso originale, byte per byte, collegato da revisione Git e SHA-256 nel manifest. Il preflight e il testo del prompt sono stati committati e pubblicati nella PR prima della generazione. La chiamata ha usato realmente `referenced_image_paths` con quel file, senza riferimenti impliciti alla chat. Il tool non espone una ricevuta separata di ingestione server. `prompts/001_C_B_request_v1.0.0_20261031.json` conserva gli argomenti effettivi completi; seed, modello interno e riscritture interne non sono disponibili.

## Convenzione di versionamento

Per il pacchetto dell’asset uso `MAJOR.MINOR.PATCH`: MAJOR per una nuova famiglia di azione o un contratto incompatibile di identità/anatomia/coordinate (non autorizza redesign); MINOR per aggiungere una posa o capacità compatibile; PATCH per correggere la stessa posa. Questo retake di C-B passa da **1.0.0 a 1.0.1**. L’ID progressivo del tentativo passa separatamente da `001_C_B` a `002_C_B`; non è la versione. La data `YYYYMMDD` nel nome è distinta dal timestamp ISO-8601 `updated_at`, con fuso Europe/Rome. Il protocollo resta 16.0.0 e il tool mantiene la propria versione. La semantica editoriale delle revisioni del protocollo è una convenzione distinta (§12), non viene applicata automaticamente ai retake PNG.

La 1.0.0 resta conservata come respinta, collegata alla decisione `reports/REJECTION_C_B_v1.0.1_20261031.json`. Il nuovo tentativo usa soltanto il canonico 008 e la regione teste/colli; una maschera deterministica protegge tutti i canali fuori regione. Le sezioni seguenti descrivono la lavorazione storica 1.0.0 finché non aggiornate con l’esito del retake.

## Contesto e modello fisico

Verificati sulla revisione `3e73adec8457458441f5c4eae121d05c03312c17`: frame 008 e README/manifest/landmark del pacchetto approvato; `assets/hell-race.js`, `assets/hell-cerbero-gallop.js`, `assets/hell-motion.js`; scheda e piano di cattura esistenti. Ispezionata anche `docs/cerbero-v2/evidence/corsa-desktop.png`: screenshot storico con vecchio renderer, utile solo a confermare camera laterale e ambiente. Non è prova visiva aggiornata del candidato nel gioco e non è stato allegato al generatore.

Cerbero è il predatore, a sinistra del bersaglio e diretto a destra, sul piano del ponte; camera a inseguimento, oggetti e veicolo rimarranno layer separati. Il renderer stabilizzato è ancora opt-in, `?cerberoGallop=stabilized`; `CHASE.width=221`, rapporto adattatore 221/500=0,442, celle sorgenti 552×522. La diagnostica ridotta riproduce quel rapporto (265×245 sul canvas con padding), non un test nel runtime o una scala definitiva di contatto con la coupé. Occlusioni/profondità definitive e punto di presa restano da verificare nel checkpoint successivo.

Gerarchia: torace → tre colli separati → tre crani → mandibole; bacino → posteriori/coda, torace → anteriori. Ossa, corna e artigli conservano forma; i colli si articolano senza allungamenti elastici. La testa centrale è quella intermedia nella vista, tra la superiore e quella più bassa/destra. Il gesto richiesto è reach con apertura della mandibola, prima del contatto: stessa sospensione estesa di 008, inerzia verso destra, nessun appoggio improvviso o frenata. Non si inferiscono massa numerica, contatti al suolo o un ciclo biomeccanico certificato dal solo frame. Le zampe vicina/lontana restano sovrapposte come nel canonico; la verifica non certifica quattro sagome separatamente visibili.

Scelta tecnica §3.1: nuovo disegno C-B mediante editing generativo della reference, perché apertura delle fauci e nuova silhouette cervicale richiedono superfici non disponibili in un semplice ritaglio rigido. Nessun rig, warp o produzione completa. La prova di questo checkpoint è 008/C-B con onion skin e flip; M, intermedi e C-C restano sospesi. Timeline di produzione non stabilita: le due esposizioni da 500 ms della GIF sono tempi diagnostici, non tempi di gioco. C-B non è un loop.

## Esito e limiti

Un solo tentativo: PNG RGBA grezzo 1290×1219 conservato in `candidates/001_C_B_raw_v1.0.0_20261031.png`. Singolo soggetto rosso/carnoso, tre teste e relativi colli leggibili, testa centrale protesa e fauci aperte; nessun veicolo, effetto, testo o scenario. Corpo, arti e coda conservano sostanzialmente il gesto sorgente, con lievi variazioni di texture/contorno. Non è una conservazione esatta dei pixel. Identità, connessioni e palette sono state confrontate visivamente, inclusa la diagnostica ridotta; la percezione artistica richiede approvazione esplicita.

Allineamento con il tool esterno `rickymusu-bit/sprites-post` bloccato a `870e1274aee5fd42ede786cff7eec944087c7771`, senza copiarne il core. Tre landmark toracici stimati manualmente, scala uniforme 0,430252259, rotazione bloccata a zero e traslazione globale. RMS 1,214 px, massimo 1,637 px: valori del fit su annotazioni con incertezza circa 8 px alla scala canonica; non misurano precisione anatomica. Nessuna trasformazione distinta di teste o arti. Il canvas comune 600×554 preserva anche gli aloni alpha quasi invisibili dell'output grezzo. Il riferimento nella GIF è solo traslato (+24,+15), senza ricampionamento; il file canonico non cambia. Matrici e limiti in `reports/ALIGNMENT_C_B_v1.0.0_20261031.json`.

La GIF alterna 008 e C-B allineati, senza morphing, ed è **diagnostica derivata dai PNG**, non registrazione del gioco o animazione finita. Onion skin, GIF e candidato sono evidenze essenziali di questa proposta, non tavole illustrative. Non è stato generato alcun atlante. I pivot/anchor della bocca sono stime provvisorie nel manifest e non autorizzano ancora il contatto C-C. La revisione runtime, la continuità con C-C e il contatto con la coupé non sono stati eseguiti perché fuori da questo checkpoint.

## Replay e controlli

Con Pillow e checkout del tool al commit bloccato:

```bash
python assets/hell-race/production/cerbero/capture-v1/reports/REPLAY_C_B_v1.0.0_20261031.py \
  --repo /percorso/quiz --tool-root /percorso/sprites-post --out /tmp/cb-review-nuova
```

Il wrapper richiama solo API del tool esterno per registrazione, onion skin e GIF. Il risultato allineato è riproducibile dal PNG grezzo. Controllati hash del canonico e del grezzo, decodifica PNG/RGBA, alpha reale, margini, trasformazioni, riferimenti del manifest, numero/durate GIF e riproducibilità pixel per pixel del derivato. Non è stata eseguita la suite funzionale: nessun codice runtime o asset in uso è modificato. Eventuali CI della PR sono verifiche indipendenti, non dichiarate già verdi.

**Decisione pendente:** approvazione esplicita di C-B prima di C-C. Nessun merge o sostituzione degli asset approvati.
