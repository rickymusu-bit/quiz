# Transizione allo spareggio — PR B

Seconda fase del piano cinematografico 1.2.0, dopo locomozione e layout.
Il motore e il formato dei salvataggi restano invariati.

## Percorso del giocatore

Il motore determina già il pareggio quando registra l'ultima risposta ordinaria.
La presentazione ora ricorda quel cambio di fase e lascia leggere l'esito.
Soltanto **Prossima domanda** avvia l'introduzione: eventuali veicoli esclusi
vengono catturati, poi compaiono **SPAREGGIO A ELIMINAZIONE**, la regola
**Un errore o il tempo scaduto ti eliminano**, i soli finalisti, un cuore e i
punti congelati. Gli Ammo sono disattivati dal motore, come prima.

La strada rallenta progressivamente. Una lieve stretta della camera (1,5%) e
un avanzamento del demone di 10 pixel logici mantengono la scala relativa e i
margini delle sagome. Titolo e pannelli usano testo nativo. In verticale il
pannello occupa lo spazio sopra la scena 4:3, lasciando visibile la corsa.

L'introduzione dura 3,8 secondi dopo le catture. **Salta introduzione** termina
soltanto la presentazione; non scavalca una cattura. **Pausa scena** o **P**
fermano il clock condiviso senza cambiare il timer o lo stato del gioco.
Il movimento ridotto propone una scheda statica con **Inizia spareggio**.
Alla conclusione, il normale `game.next()` seleziona la prima domanda: rimane
non svelata, con timer fermo e focus sul comando di svelamento.

Ogni errore o timeout dello spareggio mostra prima **ELIMINATO**, nome, causa e
cuore perso per 1,1 secondi; soltanto dopo parte la cattura esistente. Gli altri
mezzi mantengono le posizioni. Anche l'ultimo escluso riceve questo avviso prima
del Game Over. Se il motore apre un altro giro, al successivo comando viene
mostrato un richiamo di 1,6 secondi, senza ripetere la lunga introduzione.
La turnazione continua a essere quella del motore: tutti i giocatori previsti
nel giro rispondono, anche dopo le eliminazioni precedenti.

## Confini dei moduli

- `hell-tie.js`: osservatore delle transizioni, tempi e pannello accessibile.
  Non chiama il motore e non scrive lo stato della partita.
- `hell-race.js`: usa il clock già condiviso per avvisi, catture e introduzione;
  conserva la coda dei veicoli in attesa e invia una sola `fooltiecomplete`.
- `ui.js`: riceve la conclusione, verifica partita/esito e chiama il normale
  avanzamento. Input e pannelli nascosti restano inerti; i comandi della scena
  funzionano anche con tastiera. Focus, orientamento, cambio della preferenza
  di movimento, pausa e ritorno dal background conservano il percorso.

Lo stato cinematografico è effimero. Un salvataggio ripristinato nello spareggio
non ricrea introduzioni, avvisi o catture già storici; conserva esito, punti,
sanzioni e timer e attende l'interazione normale. Un ridisegno della stessa
partita durante il filmato conserva invece il progresso in memoria.

## Verifica e anteprima

`npm run test:ties` verifica i contratti puri e il vero HTML offline: cinque
viewport a DPR 1/2, input/focus, pausa e cambio scheda, orientamento, due o tre
finalisti, cattura prima del titolo, nuovi giri, errori e timeout, Game Over,
movimento ridotto e ripresa. Produce screenshot, GIF e report in `artifacts/tie/`.
Per una verifica locale breve: build `--quality-preview`, poi
`python3 tests/tie_browser.py --quick`.

L'export `dist/Hellscape-review.html` aggiunge gli scenari **Intro spareggio (3)**,
**Intro spareggio (2)**, **Nuovo giro** ed **Eliminazione (in pausa)**. Usano lo
stesso motore e le stesse transizioni della partita; non aggiungono comandi al
sito pubblicato. Le suite esistenti continuano a verificare motore, persistenza,
Ammo, finali, terreno, layout e risorse offline.

Fila indiana, nuove prese e inseguimento del vincitore restano nella PR C;
portale monumentale, ponte ed epilogo restano nella PR D.
