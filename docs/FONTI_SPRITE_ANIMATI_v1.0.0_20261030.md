# Fonti per sprite animati e ricerca di creature volanti

**Versione:** v1.0.0  
**Data:** 30 ottobre 2026 — Europe/Rome  
**Progetto:** Hellscape — rickymusu-bit/quiz  
**Stato:** catalogo di fonti e candidati; nessun asset selezionato, approvato o integrato.  
**Protocollo:** [v11.0.0](PROTOCOLLO_SPRITE_ANIMATI_v11.0.0_20261030.md), con verifica di camera, scala, anatomia e tecnica prima dell'integrazione.

## Raccolte da consultare

| Fonte | URL | Impiego | Licenza e stato della verifica |
| --- | --- | --- | --- |
| OpenGameArt | https://opengameart.org/ | Sprite, creature ed effetti; cercare anche gargoyle, imp, demon, bat e flying creature | Licenza specifica di ogni asset. Schede web non raggiungibili dagli strumenti di ricerca in questa sessione. |
| Kenney | https://kenney.nl/assets | Pacchetti coerenti, personaggi e grafica per giochi | Verificare il LICENSE del pacchetto; non desumere animazioni o idoneità dal solo catalogo. Pagina non verificata in questa sessione. |
| itch.io | https://itch.io/game-assets/free/tag-sprites | Pacchetti animati di autori indipendenti | Il filtro free indica il prezzo, non i diritti. Controllare termini del singolo autore, modifiche e redistribuzione dei file sorgenti. |
| Universal LPC Spritesheet Generator | https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/ | Personaggi componibili e animazioni predisposte | Licenze/crediti dipendono dai componenti. Non è una raccolta di soli demoni volanti; verificare la distinta dei crediti dell'export. |

**Criterio:** gratuito, pubblico su GitHub e liberamente riutilizzabile sono condizioni diverse. Prima di importare un file registrare autore, pagina originale, licenza/versione e condizioni applicabili proprio a quel file. Le descrizioni secondarie non sostituiscono la licenza dell'autore. Conservare i termini con il pacchetto scelto; non attribuire la licenza del codice di un gioco alla sua grafica.

## Candidati trovati

### A. Flying Demon 2D Pixel Art — Mattz Art / xzany

- Pagina autore: https://xzany.itch.io/flying-demon-2d-pixel-art
- Esistenza e attribuzione confermate dai crediti letti di [Girl in The Red Cape](https://github.com/RaFive/Girl-in-The-Red-Cape/blob/72fc45ae2f58fe9ab1eb6591d3d31894b8221717/README.md), sezione Enemy, e dal catalogo crediti di Emrecan45/colormage.
- È un candidato tematicamente diretto per il diavolo volante; questa è una valutazione sul soggetto descritto, non una verifica visiva del pacchetto.
- **Da verificare sulla pagina originale:** prezzo attuale, termini di licenza, animazioni incluse, frame e risoluzione, camera, uso commerciale, modifiche e possibilità di includere i PNG in un repository pubblico.
- **Esito:** candidato prioritario da ispezionare; non classificato come libero né approvato per integrazione.

### B. Flying Eye — LuizMelo, Monsters Creatures Fantasy

- Pagina autore: https://luizmelo.itch.io/monsters-creatures-fantasy
- [Scheda secondaria letta](https://github.com/TMHSDigital/Free-Game-Dev-Assets/blob/9ab20cbbbcb3e3115798175c3e3cf98bbe708510/catalog/2d/luizmelo-monsters-creatures-fantasy.md): descrive un pacchetto di quattro nemici animati, incluso Flying Eye, PNG per vista laterale; dichiara CC0-1.0 e riporta una verifica della pagina autore al 24 agosto 2026.
- La presenza di Flight.png è anche documentata nei file di importazione di [Legendary-Creatures-2](https://github.com/sllain/Legendary-Creatures-2/blob/1a724b9e0d1c4e184ee544dac76f23a2cc808d18/res/animImg/Flying%20eye/Flight.png.import).
- **Valutazione:** alternativa mostruosa volante, non un diavolo umanoide; la vista laterale può richiedere un diverso impiego rispetto alla sagoma quasi frontale prevista per il diavolo.
- **Licenza:** CC0 dichiarata dalla fonte secondaria; non riconfermata direttamente sulla pagina dell'autore in questa sessione.
- **Esito:** candidato da verificare sul pacchetto originale prima dell'importazione.

### C. Gargoyle / Dark Gargoyle e varianti — Stendhal

- [Proposta grafica originale letta](https://github.com/arianne/stendhal/issues/162): il contributore olonu descrive la derivazione da LPC Lizard Headgear e Drakes and lizardfolk di Nila122.
- [Crediti del progetto letti](https://github.com/arianne/stendhal/blob/fcd8330db06034098f9b164aa67fed82f261ae59/doc/sources/graphics-entity.txt), sezione data/sprites/entity/gargoyle/: gargoyle.png, dark_gargoyle.png, elder_gargoyle.png e venom_gargoyle.png; autori Nila122, Stephen Challener (Redshrike), olonu; **CC BY-SA 3.0**.
- Fonti artistiche indicate dal contributore: https://opengameart.org/content/lpc-lizard-headgear e https://opengameart.org/content/drakes-and-lizardfolk
- **Limiti:** le richieste dei file PNG al percorso riportato dai crediti hanno restituito 404. Numero di pose, battito alare, animazione, camera e qualità visiva non verificati; non presentare questi file come un ciclo di volo già disponibile.
- **Esito:** pista con attribuzione/licenza documentate per quei file, ma disponibilità dei byte e animazione da accertare.

### D. Flying Demon idle — esempio visivamente ispezionato in Dungeonlike

- [Documentazione letta](https://github.com/localgod13/Dungeonlike/blob/main/FLYING-DEMON-ENEMY.md).
- [PNG ispezionato](https://github.com/localgod13/Dungeonlike/blob/main/assets/sprites/Enemies/flying%20demon/IDLE.png), blob SHA `2f4267096236f8c6e1630ca95ffdedca1138dad2`.
- La documentazione indica 316 × 69 px, quattro celle 79 × 69, playback a 6 FPS. Il foglio aperto mostra un piccolo demone rosso, corna scure, ali viola e quattro pose, con corpo abbastanza stabile.
- **Valutazione visiva:** soggetto pertinente per un imp decorativo; stile piuttosto caricaturale. È stato aperto il foglio statico, non riprodotto e validato il ciclo animato.
- **Licenza e autore originali non identificati.** Il repository pubblico non autorizza da solo il riuso della grafica. Non assumere che sia lo stesso asset di xzany o che una licenza del codice lo copra.
- **Esito:** riferimento trovato ma non utilizzabile nel progetto finché non sono chiariti provenienza e termini. Nessun PNG copiato nel repository di Hellscape.

## Verifica prima della selezione

1. Recuperare pagina e pacchetto dell'autore e conservare la licenza esatta per il file scelto.
2. Aprire il PNG e riprodurre il ciclo completo: estremi, breakdown, andata/ritorno, contatti e dettagli persistenti.
3. Verificare alpha, dimensioni delle celle, frame effettivi, durata e margini.
4. Confrontare camera e silhouette con la scena di Hellscape e provare la dimensione reale; non cambiare automaticamente la direzione artistica.
5. Registrare se basta playback, serve un adattamento grafico consentito o si usa solo lo studio del movimento. Una derivazione resta soggetta alle condizioni della fonte.
6. Presentare candidato e prova prima della sostituzione dell'asset in uso.

## Limiti della ricerca e manutenzione

Ricerca effettuata il 30/10/2026. Il servizio web ha restituito errori sia con ricerca sia con apertura delle pagine: non è stato possibile verificare direttamente i cataloghi o i termini attuali di itch.io/OpenGameArt/Kenney. Le ricerche e letture nei repository GitHub hanno permesso di trovare le piste e le evidenze distinte sopra. Non sono stati acquistati né integrati asset. Un elenco di piste non equivale a una selezione di risorse tutte libere o tutte animate.

Aggiornare questo documento con nuova versione quando cambia la selezione o la valutazione; conservare normalmente ultima e penultima versione. Prima di cambiare il percorso aggiornare il collegamento dal protocollo. I link al commit restano evidenza della revisione consultata; i link alle pagine degli autori servono per la verifica corrente.

| Versione | Data | Modifica |
| --- | --- | --- |
| v1.0.0 | 2026-10-30 | Salva le quattro raccolte e le prime quattro piste, separando licenze documentate, dichiarazioni secondarie, ispezione visiva e verifiche mancanti. |
