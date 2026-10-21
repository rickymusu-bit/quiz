# quiz

Materiali del quiz di Riccardo Musumarra, separati dal repository `rickymusu-bit/fisica` su richiesta dell’autore.

- `Chi_vuol_essere_rimandato_quiz_v3_20261008.html`: gioco a quiz.
- `Chi_vuol_essere_rimandato_regole_v9_20261008.html`: presentazione delle regole per la classe.
- `Template_dataset_quiz_argomenti_v1_20261008.json`: modello del dataset.
- `Prompt_generazione_dataset_quiz_v1_20261008.txt`: istruzioni per preparare i dataset.

## Documenti di riferimento

- [Regolamento ufficiale](docs/REGOLAMENTO_UFFICIALE.md) — fonte normativa del gioco, versione 10.0.0.
- [Specifiche del programma](docs/SPECIFICHE_PROGRAMMA.md) — comportamento, formato dataset, criteri di accettazione e stato dell'implementazione, versione 10.0.0.

Prima di modificare il programma o la presentazione, leggere entrambi i documenti. Il regolamento prevale sulle specifiche e sugli HTML; le questioni aperte richiedono una decisione esplicita, senza trasformare automaticamente il codice esistente in una regola. Le modifiche alle regole devono aggiornare i riferimenti e le verifiche pertinenti. Le migliorie indicate come future non sono già implementate.

I documenti hanno nomi stabili, versione interna e cronologia Git. Gli HTML attuali non sono ancora adeguati al regolamento 10.0.0: applicano ancora −1 per errore/scadenza, 30 secondi predefiniti e il precedente premio del 10 a soglia. Mancano inoltre moltiplicatore di serie e premi Salta turno, Ruba punti e Svela e passa conservabili e accumulabili, con uso solo nel proprio turno (probabilità configurabile, tipi equiprobabili e interazioni ancora da deliberare), rotazione fissa senza passaggi liberi, Pausa/Riprendi, adattamento verificato in altezza senza scorrimento, salvataggio/ripresa e spareggio «Chi vuol essere eliminato» con dataset ordinario a quattro alternative, stesso tempo normale e nessuna nuova assegnazione di premi; il vecchio comando di fine modulo non applica la nuova sospensione. Prima di usare le nuove regole con il programma e la presentazione occorre aggiornarli.

Scarica gli HTML e aprili nel browser. I materiali originari sono stati trasferiti integralmente: la loro provenienza e i relativi hash sono registrati in `PROVENIENZA.json`; la cronologia precedente rimane nel repository di origine. Nessuna pubblicazione GitHub Pages è stata attivata per il quiz.
