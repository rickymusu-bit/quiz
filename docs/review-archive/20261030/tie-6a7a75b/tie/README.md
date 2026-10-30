# PR B — spareggio

Sorgente degli screenshot e dell’HTML: `6a7a75b236b1432e069759fcde7e4062803c7280`.

Gli screenshot dell’introduzione sono acquisiti in pausa dal vero HTML offline; il pulsante Riprendi scena corrisponde a quello stato. La GIF generata dalla stessa suite mostra la ripresa e il ritorno alla domanda non svelata. Il ritratto usa il letterbox sopra la scena per mantenere visibile tutta la corsa.

`npm run test:ties` rigenera HTML, screenshot, GIF e report a cinque viewport/DPR 1/2, più catture, nuovi giri, tre eliminazioni/Game Over, movimento ridotto e ripresa. La CI produce il pacchetto completo: https://github.com/rickymusu-bit/quiz/actions/runs/40647320050#artifacts.

Aprire `dist/Hellscape-review.html` e usare **Scenari di revisione → Intro spareggio (3)**, **Intro spareggio (2)**, **Nuovo giro**, **Eliminazione (in pausa)**. Questi controlli appartengono soltanto all’export di revisione. Il codice del gioco è quello della PR #33; questo ramo aggiunge solo materiale di verifica e non viene unito a main.
