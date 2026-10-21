# Skool

Materiali di **Skool**, il quiz di Riccardo Musumarra precedentemente chiamato «Chi vuol essere rimandato», separati dal repository `rickymusu-bit/fisica` su richiesta dell’autore.

- `Chi_vuol_essere_rimandato_quiz_v3_20261008.html`: gioco a quiz.
- `Chi_vuol_essere_rimandato_regole_v9_20261008.html`: presentazione delle regole per la classe.
- `Template_dataset_quiz_argomenti_v1_20261008.json`: modello del dataset.
- `Prompt_generazione_dataset_quiz_v1_20261008.txt`: istruzioni per preparare i dataset.

## Documenti di riferimento

- [Regolamento ufficiale](docs/REGOLAMENTO_UFFICIALE.md) — fonte normativa del gioco, versione 14.0.1.
- [Specifiche del programma](docs/SPECIFICHE_PROGRAMMA.md) — comportamento, formato dataset, criteri di accettazione e stato dell'implementazione, versione 14.1.1.

- [Specifiche grafiche](docs/ASPETTO_GRAFICO.md) — nome Skool, Doom classico con estetica pixel e raccolta progressiva delle caratteristiche visive, versione 1.1.0.

Prima di modificare il programma o la presentazione, leggere i documenti di riferimento pertinenti; per l’interfaccia consultare anche le specifiche grafiche. Il regolamento prevale sulle specifiche e sugli HTML; le questioni aperte richiedono una decisione esplicita, senza trasformare automaticamente il codice esistente in una regola. Le modifiche alle regole devono aggiornare i riferimenti e le verifiche pertinenti. Le migliorie indicate come future non sono già implementate.

I documenti hanno nomi stabili, versione interna e cronologia Git. Gli HTML attuali usano ancora il vecchio nome e la vecchia grafica e non sono adeguati al regolamento 14.0.1: applicano ancora −1 per errore/scadenza, 30 secondi predefiniti e il precedente premio del 10 a soglia. Mancano inoltre sanzioni prioritarie con pausa automatica, contatore separato ed eliminazione alla terza, punti base configurabili per difficoltà (100/200/300 predefiniti), moltiplicatore di serie da seconda corretta, senza tetto e premi Salta turno, Ruba punti e Svela e passa conservabili e accumulabili, con uso solo nel proprio turno (probabilità configurabile, tipi equiprobabili e un solo uso per turno, Ruba punti simultanei con quote uguali), rotazione fissa senza passaggi liberi, Pausa/Riprendi, adattamento verificato in altezza senza scorrimento, salvataggio/ripresa e spareggio «Chi vuol essere eliminato» con dataset ordinario a quattro alternative, stesso tempo normale e nessuna nuova assegnazione di premi; il vecchio comando di fine modulo non applica la nuova sospensione. Prima di usare le nuove regole con il programma e la presentazione occorre aggiornarli.

Scarica gli HTML e aprili nel browser. I materiali originari sono stati trasferiti integralmente: la loro provenienza e i relativi hash sono registrati in `PROVENIENZA.json`; la cronologia precedente rimane nel repository di origine. Nessuna pubblicazione GitHub Pages è stata attivata per il quiz.
