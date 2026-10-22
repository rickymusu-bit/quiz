# Codex — schermata introduttiva «MASSACRO»

Versione: 1.0.0 · 22/10/2026 · Stato: specifica approvata, DA IMPLEMENTARE

## Obiettivo
Implementare una schermata **HTML/CSS/JS realmente funzionante**, a comparsa obbligatoria quando termina la fase ordinaria di 33 domande e prima della prima domanda del Massacro. Questa schermata si ispira all'anteprima visiva approvata in chat (titolo monumentale metallico «MASSACRO», ambientazione infernale rétro FPS anni '90, pannelli in metallo/pietra, rosso fuoco, tipografia pixel, pulsante verde scuro con testo dorato). L'immagine è **riferimento estetico**, non una schermata da inserire come immagine raster intera: dati, testo, layout e pulsante devono essere elementi HTML accessibili.

## Impostazione e contenuti
- In alto grande titolo «MASSACRO», sotto «LA FASE ORDINARIA È TERMINATA!».
- Pannello «GRUPPO ELIMINATO»: mostra nome e punteggio dell'ultimo unico classificato, dinamici. Se **c'è una parità all'ultimo posto**, non presentare falsamente un gruppo eliminato: pannello «NESSUN GRUPPO ELIMINATO — PARITÀ ALL'ULTIMO POSTO», con spiegazione; i gruppi restano tutti ammessi secondo il regolamento vigente.
- Pannello «GRUPPI AL MASSACRO»: due o tre schede con i nomi reali dei gruppi qualificati e i rispettivi punti ordinari. Non usare nomi, colori, simboli o valori segnaposto fissi nell'interfaccia di produzione; riutilizzare i simboli/identità di squadra configurati.
- Riquadro «REGOLAMENTO DEL MASSACRO» in forma concisa: «Ogni gruppo risponde a 3 domande difficili consecutive»; «Ogni risposta corretta vale 1 nel Massacro»; «Vince chi ottiene più risposte corrette nella batteria»; «In caso di parità si ripete con altre 3 domande per ciascun gruppo ancora pari». Specificare che i punti ordinari non danno vantaggi nel Massacro.
- Pulsante centrale, grande, etichettato «INIZIA IL MASSACRO». Al click soltanto, procedere alla prima domanda nascosta senza avviare il timer: il conto alla rovescia parte, come già ora, solo quando il docente preme «Svela e avvia il tempo».
- Mostrare la schermata **una sola volta all'entrata nel Massacro**. Non riproporla prima delle batterie successive; per queste mostrare una comunicazione chiara sulla nuova batteria e sui gruppi rimasti, senza duplicare l'introduzione.

## Specifiche tecniche obbligatorie
1. Leggere il motore corrente `Fool.html` e `Fool_regole.html` in `main`, regolamento 18.2.0 o versione più recente; preservare la logica consolidata e le altre schermate.
2. Gestire lo stato della schermata introduttiva esplicitamente (es. `screen: 'massacro-intro'`), includerlo nella serializzazione, nei controlli di validazione e nel ripristino della partita salvata. Non far apparire una domanda prima che il docente abbia dato il via.
3. Quando il risultato della 33ª domanda viene registrato, eseguire le transizioni della gara e mostrare l'introduzione: assicurarsi che la risposta conclusiva e la sua soluzione siano visibili prima del cambio di schermata, oppure prevedere un chiaro passaggio di conferma. Il docente non deve perdere la schermata del risultato.
4. Se resta un solo gruppo attivo per eliminazioni, rispettare le regole di vittoria anticipata: non mostrare il Massacro senza sfidanti. Se tutti sono eliminati, non creare vincitori.
5. Compatibilità con pausa/sospensione/ripresa fra lezioni, tasto home, fullscreen, smartphone orizzontale, tastiera e riduzione del movimento. Mantenere buona leggibilità su proiettore e mobile, evitando overflow e riduzioni estreme dei font.
6. Contrasti adeguati: sfondo infernale scenografico e bordi decorativi **non devono interferire** con testi e pulsanti. Elementi decorativi non focusabili, attributi semantici e focus visibile, nessuna dipendenza da hover per utilizzare il pulsante.
7. Non incorporare l'immagine di riferimento come unica interfaccia, non generare testi nell'immagine. Evitare asset esterni con licenza incerta; preferire CSS, SVG originali e risorse già autorizzate in `assets/`.
8. Aggiornare versione app, documentazione e test; non alterare le regole del Massacro durante il lavoro. Preparare una PR revisionabile da `main`; **non pubblicare né fare merge senza approvazione**.

## Test di accettazione
- 33ª domanda con punteggi 600/450/300 → ultimo (300) eliminato, altri due mostrati, intro, pulsante, prima domanda senza timer.
- 33ª domanda con 600/300/300 → nessuna eliminazione arbitraria: tre gruppi ammessi e testo corretto nell'intro.
- Intro con nomi lunghi, punteggi grandi, schermi piccoli e zoom testo.
- Reload mentre l'intro è visibile → stessa intro, dati invariati e nessuna domanda consumata.
- Rientro nella stessa partita già avviata → intro non ricompare.
- Terza sanzione, sospensione per campanella e nessuna domanda difficile disponibile non corrompono il salvataggio.
- Testare che non si aprano più volte turni di domanda o timer per doppi click.

## Riferimento grafico
L'anteprima approvata nella conversazione del 22 ottobre 2026 usa una scenografia pixel-art con cielo rosso, rovine e lava, scritta «MASSACRO» in metallo incandescentе, pannelli scolpiti per eliminati e qualificati, regolamento e grande bottone verde/oro. Conservare la gerarchia visiva, non copiare letteralmente i nomi/valori mostrati nell'esempio (VERDI 17, BLU/ROSSI 26). L'immagine generata è un **mockup**, non un asset pronto al prodotto.
