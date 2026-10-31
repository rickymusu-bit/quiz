# Cerbero proliferante — riferimento approvato

**Pacchetto:** 1.0.5 · **Data:** 31 ottobre 2026, Europe/Rome. Timestamp e hash in `manifest.json`.

`reference.png` è il **primo concept scelto dall’utente**, conservato byte per byte: 1536×1024 RGBA, SHA-256 `f5f5216a2b20c3b07354b3e91a00b68608c92751434abec1d303b9e1be0bab1f`. La creatura resta quella originale, senza pelo aggiunto, ridisegno, spostamento delle teste o modifica di materiali e proporzioni. I tentativi successivi non la sostituiscono.

Il PNG contiene più teste di dimensioni e aspetti diversi, proliferazioni organiche, carne, osso, piastre recuperate e catene nello stile horror demoniaco junkpunk selezionato. Numero, identità, radici e profondità delle parti sono fissati dall’immagine: annotarli prima delle animazioni, senza imporre la vecchia anatomia a tre teste o i nuovi design respinti. L’originale contiene alpha reale; alcuni pixel di sfondo hanno alpha residuo fino a 3/255, e il massimo del canale è 254. Non normalizzare o ricodificare autonomamente questo originale approvato.

## Scala e approvazione

L’utente ha chiesto di ridurre del 40% la prima prova sul ponte e poi ha approvato il risultato: **«Perfetto. Salva il riferimento e fai il merge della PR»**. L’approvazione riguarda il PNG originale e la seguente composizione statica:

- Scala uniforme **0,174**, pari al 60% della precedente 0,29; nessuno skew, warp o scala diversa sui due assi.
- Canvas sorgente 1536×1024; ingombro del canvas disegnato **267,264×178,176** unità logiche.
- Traslazione **x=10, y=159**; appoggio di riferimento stimato a y=333 usando il landmark sorgente y=1000.
- Scena logica **768×576**, viewport **1024×768**. Ponte, lava e coupé hanno le dimensioni del renderer corrente; i layer in primo piano conservano le occlusioni.

L’appoggio è una taratura visiva statica, non un rig o una certificazione biomeccanica. La possibilità precedente di occupare tutta la carreggiata è stata concretizzata dall’ultima scala ridotta approvata: non reingrandire automaticamente la creatura per riempire la strada.

[Anteprima approvata](evidence/approved-layout_v1.0.5_20261031.png) e `layout/layout_v1.0.5_20261031.json` documentano una **composizione tecnica** nel browser con funzioni native del ponte, immagine originale e coupé canonica. Non è una partita registrata o un’integrazione runtime. La prova mostra due posizioni illustrative della coupé; non sono nuove regole di corsia.

## Provenienza e replay

`prompts/001_reference_request_v1.0.0_20261031.json` conserva l’esatto prompt esplicito della prima chiamata, il suo identificatore di output e i parametri esposti. Il prompt interno e il seed non sono disponibili. Il prompt era un’esplorazione iniziale: eventuali dettagli che il risultato interpreta diversamente non autorizzano a ridisegnare ora il modello scelto dall’utente.

La piccola `references/coupe_V0_intact.png` è l’estrazione del primo frame integro dal renderer, con provenienza e hash nel manifest. Non sostituisce l’atlante dei veicoli. Il replay usa Chromium, Playwright e gli asset del repository, senza chiamate generative:

```bash
python assets/hell-race/production/cerbero/proliferating-reference-v1/reports/replay_approved_layout.py \
  --repo /percorso/quiz --out /tmp/cerbero-reference-replay
```

La nuova identità è approvata come **riferimento di produzione** per le animazioni future. Il codice e gli asset del gioco in uso restano quelli esistenti; il ciclo storico `run-stabilized-v1` rimane conservato per riproducibilità e non è una corsa già coerente col nuovo modello. Seguire il protocollo v16.0.0 e fornire realmente `reference.png` al generatore prima di nuove pose.

**Versioni:** 1.0.0 identifica la prima immagine; 1.0.5 identifica il pacchetto con l’ultima scala approvata. Non rinumerare la figura come se fosse una nuova generazione. La PR #104 sui colli del vecchio modello è superata; il riferimento scelto è questo, non la sua candidata.
