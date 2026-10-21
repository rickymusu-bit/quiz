# Skool — Specifiche dell’aspetto grafico

Versione: **1.1.1** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

## 1. Scopo e stato

Questo documento raccoglie progressivamente le caratteristiche grafiche indicate dal responsabile per **Skool**, nuovo nome del quiz precedentemente chiamato «Chi vuol essere rimandato». È il riferimento per l’identità visiva del programma e della presentazione HTML delle regole.

È un documento di progettazione: la sua creazione non modifica gli HTML esistenti. Le indicazioni successive vanno integrate qui, distinguendo decisioni approvate e dettagli ancora da scegliere. Le sezioni non ancora compilate non autorizzano a inventare preferenze del responsabile.

Il [regolamento](REGOLAMENTO_UFFICIALE.md) definisce il gioco; le [specifiche del programma](SPECIFICHE_PROGRAMMA.md) ne definiscono il comportamento e i vincoli. Questo documento definisce l’aspetto. Le scelte grafiche devono conservare le informazioni e i comandi richiesti dagli altri due documenti.

## 2. Indicazioni approvate

| ID | Caratteristica | Indicazione |
| --- | --- | --- |
| VIS-01 | Nome del gioco | **Skool** |
| VIS-02 | Riferimento visivo | Un aspetto grafico ispirato a **Doom classico**, con **estetica pixel** |
| VIS-03 | Ambito | Identità visiva del software del quiz; la presentazione HTML delle regole deve usare lo stesso nome e una veste coerente |
| VIS-04 | Aggiornamenti successivi | Raccogliere in questo documento le caratteristiche grafiche che il responsabile elencherà |

Il riferimento approvato è **Doom classico**, con estetica pixel. Questa scelta stabilisce la direzione visiva di Skool; non cambia il regolamento o le funzioni del quiz. Palette, caratteri specifici, logo, materiali, disposizione, animazioni e suoni restano da definire con le prossime indicazioni del responsabile. L’estetica pixel deve rispettare la leggibilità di testi e formule prevista nelle specifiche.

## 3. Applicazione del nome

Il titolo visibile del prodotto diventa **Skool**: copertina, titolo della pagina/browser, menu, schermate finali e intestazioni della presentazione devono essere coerenti quando verranno aggiornati gli HTML.

Il nome della fase di spareggio **«Chi vuol essere eliminato»** resta quello già approvato finché non viene chiesta una modifica specifica.

I file HTML originari e i documenti di provenienza mantengono per ora i loro nomi storici. Il nome del prodotto non richiede di cambiare il nome del repository, invalidare i salvataggi o rinominare automaticamente file e percorsi già collegati.

## 4. Vincoli già stabiliti per l’interfaccia

Questi vincoli provengono dalle specifiche funzionali; non sono ulteriori preferenze estetiche:

- Schermata operativa adattata a larghezza e altezza disponibili, con tutte le informazioni della schermata corrente leggibili senza scorrimento, nei limiti di dimensioni e contenuti verificati secondo SPEC-33.
- Nessun testo tagliato, comando fuori schermo o riduzione della leggibilità per imitare lo stile scelto.
- Stato di turno, timer/pausa, domanda, risposte, punteggi, serie, premi e sanzioni distinguibili nella fase appropriata.
- Focus visibile e uso da tastiera; correttezza, errore, pausa ed eliminazione riconoscibili anche tramite testo, oltre al colore.
- Copertina, configurazione, anteprima docente, scelta Svela e passa, risposta, esito, pausa, gestione sanzioni, sospensione/ripresa e spareggio devono appartenere allo stesso sistema visivo.
- Risorse necessarie disponibili nell’HTML autonomo anche offline; comportamento di gioco e scelte grafiche devono restare coerenti con le specifiche.

## 5. Caratteristiche da raccogliere

| Area | Stato attuale |
| --- | --- |
| Edizione/stile di Doom di riferimento | **Approvato: Doom classico, estetica pixel** |
| Logo e trattamento del nome Skool | Da definire |
| Palette, contrasti e colori degli stati | Da definire |
| Caratteri per titoli, testo, timer e punteggi | Da definire |
| Sfondo, pannelli, bordi, texture e materiali | Da definire |
| Disposizione del tabellone e delle informazioni di gioco | Da definire rispettando SPEC-33 |
| Aspetto dei pulsanti e dei quattro premi | Da definire: Salta turno, Ruba punti, Svela e passa e Aura |
| Protezione Aura attiva | Rappresentazione grafica da definire; durata e consumo seguono DEC-20 del regolamento |
| Rappresentazione delle sanzioni e dell’eliminazione | Da definire |
| Transizioni e animazioni | Da definire |
| Eventuali suoni | Da definire; nessun suono è stato richiesto finora |
| Adattamenti della presentazione delle regole | Da definire dopo la direzione del programma |

## 6. Verifica prima dell’implementazione definitiva

Le verifiche visive devono coprire le schermate e le dimensioni supportate, includendo domande lunghe, formule, molti premi accumulati e punteggi frazionari. La somiglianza al riferimento va verificata insieme alla leggibilità e all’uso in classe.

Le caratteristiche VIS approvate devono essere collegate alle schermate pertinenti e aggiornate quando cambia una scelta. Le aree «da definire» restano aperte per le prossime indicazioni; questa prima edizione non costituisce una proposta grafica già realizzata.

## 7. Revisioni

Percorso stabile, versione interna e cronologia Git.

| Versione | Data | Modifica |
| --- | --- | --- |
| 1.0.0 | 21/10/2026 | Nome Skool, direzione estetica Doom e documento per raccogliere le successive indicazioni grafiche |
| 1.1.0 | 21/10/2026 | Riferimento precisato: Doom classico con estetica pixel; altri dettagli visivi ancora da raccogliere |
| 1.1.1 | 21/10/2026 | Aggiunta Aura alle aree grafiche da definire; nessuna icona o animazione ancora approvata |
