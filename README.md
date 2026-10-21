# Fool — sito GitHub Pages

Questo ramo contiene il sito pubblico di Fool, app 1.0.0 e regolamento 18.0.1.

Indirizzo previsto: https://rickymusu-bit.github.io/quiz/

- `index.html`: pagina iniziale.
- `Fool.html`: gioco autonomo.
- `Fool_regole.html`: presentazione delle regole.
- `Dataset_termologia_100_domande_v1_20261021.json`: banca scaricabile.
- `.nojekyll`: pubblicazione statica dei file.

GitHub Pages usa il ramo `gh-pages`, cartella `/`.
Il codice sorgente e il resoconto delle verifiche sono nel ramo
`codex/fool-offline-18-0-1` e nella pull request #1.

Per aggiornare il gioco rigenerare i due HTML con `python3 tools/build.py`
nel ramo sorgente e sostituire i corrispondenti file di questo ramo.
Il caricamento dei dataset e i salvataggi avvengono nel browser del docente;
il sito non invia partite o dati degli studenti a un server applicativo.
