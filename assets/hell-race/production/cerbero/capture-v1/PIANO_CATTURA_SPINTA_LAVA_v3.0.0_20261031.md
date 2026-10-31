# Cerbero — fiammata, rallentamento e spinta del veicolo nella lava

**Versione:** 3.0.0 · **Data:** 31 ottobre 2026, Europe/Rome. Timestamp nel manifest.
**Stato:** riferimento proliferante e scala statica 1.0.5 approvati; piano d’azione, nessuna nuova animazione integrata.
**Fonti prevalenti:** «No allora niente salto, solo una spinta che manda fuori strada il veicolo e giù dal ponte nella lava» e successiva precisazione «Prima dell’avvicinamento, fiammata del cerbero che dà fuoco al veicolo, che rallenta e quindi viene raggiunto».
**Norme:** AGENTS.md e protocollo sprite v16.0.0.

Questa direzione sostituisce la cattura con morso/presa. La proposta di salto e schiacciamento è accantonata prima di generare immagini o pubblicare quel piano. La fiammata è confermata come causa iniziale del rallentamento: incendio a distanza, raggiungimento, spinta e caduta nella lava.

## Sequenza proposta

1. **Fiammata a distanza.** Il veicolo perdente è ancora davanti a Cerbero. Il mostro sputa fuoco verso la sua carrozzeria: non ha già raggiunto o affiancato il bersaglio. Ogni getto nasce dalla bocca effettiva e segue orientamento e movimento della testa, con le occlusioni naturali delle altre teste.
2. **Incendio e rallentamento.** Il fuoco colpisce e si attacca al mezzo. Solo dopo l’accensione il veicolo perde velocità: l’incendio precede e motiva il rallentamento. La carrozzeria mantiene la sua scala e rigidità, senza deformazioni elastiche. Fiamme e avanzamento del veicolo restano livelli distinti.
3. **Avvicinamento.** Cerbero recupera la distanza perché il bersaglio rallenta; poi lo affianca sul lato interno del ponte rispetto al bordo di caduta. La riduzione del distacco deve derivare dalle velocità relative nel mondo, senza teletrasportare attori o bloccare artificialmente la strada.
4. **Contatto e spinta laterale.** Spalla e torace incontrano la fiancata del mezzo in fiamme; peso e spinta sono sostenuti da appoggi leggibili. Il corpo del mostro lo devia fuori carreggiata. Le teste non afferrano il veicolo. Ruote, carrozzeria e centro di massa seguono lo stesso corpo rigido; il contatto viene calibrato sulla sagoma effettiva di ogni modello senza ridimensionarlo.
5. **Caduta nella lava.** Superato il bordo, il mezzo perde sostegno, si inclina e cade con gravità e inerzia. Non farlo sparire né attraversare solidi. L’impatto e l’affondamento avvengono dopo la traiettoria di caduta; l’incendio può continuare durante la caduta e reagisce all’ingresso nella lava.
6. **Ripresa della corsa.** Cerbero scarica l’appoggio, recupera il passo e continua a correre. Il raccordo riusa il ciclo canonico e mantiene separate camera, moto del ponte e movimento degli attori.


Tempi, ampiezza della deviazione e numero di pose saranno giudicati in anteprima, non fissati dal solo piano. La cattura visualizza un’eliminazione già decisa: nessuna modifica a punteggi, turni o criteri di eliminazione. Il rallentamento riguarda la presentazione del mezzo perdente, non introduce una nuova penalità di gioco. Fuoco, velocità, distanza e animazione seguono il tempo attivo della scena e si fermano/riprendono insieme. La fiammata di cattura è un evento della sequenza, distinto dal timer periodico del fuoco già esistente.

## Vincoli della scena e dei veicoli

- Usare scala, silhouette e primo fotogramma canonico del renderer per ogni veicolo. Le altezze differenti incidono sulla regione di contatto spalla/fiancata; non richiedono allineare tre bocche.
- La spinta è trasversale alla strada nello spazio del ponte. Rispettare prospettiva, shear, piano di profondità e camera, senza tradurla automaticamente in un movimento verticale arbitrario sullo schermo.
- Verificare un tratto di bordo accessibile nella scena. Un parapetto presente resta un ostacolo: non attraversarlo con la carrozzeria. Eventuale cedimento locale della barriera richiede una soluzione visiva esplicita; non alterare autonomamente il ponte approvato per esporre il veicolo.
- Conservare l’ordine di disegno e le occlusioni delle strutture in primo piano durante uscita, caduta e ingresso nella lava.
- Non muovere gli altri veicoli per liberare la scena. La traiettoria riguarda il solo mezzo eliminato e il suo inseguitore.
- Effetti della lava e affondamento seguono punti e tempi d’impatto effettivi; non coprono un errore di traiettoria.

## Anatomia, riferimenti e produzione

Il modello canonico per la produzione futura è il [Cerbero proliferante approvato](../proliferating-reference-v1/README.md), con `../proliferating-reference-v1/reference.png` conservato identico al primo concept scelto e scala uniforme 0,174 nella composizione approvata. Il pacchetto a tre teste `run-stabilized-v1` resta storico e riproducibile; non è il modello delle nuove pose. Prima di una generazione fornire realmente tutti i PNG necessari, verificando il collegamento al tool e conservando prompt effettivo, input, output, versioni e hash.

Le teste del riferimento approvato rimangono connesse secondo la loro anatomia e profondità. Il numero e gli attacchi devono essere annotati sul PNG, non ereditati dal vecchio modello a tre teste. Possono essere parzialmente coperte da quelle vicine: non separarle o spostarle per mostrarle tutte. Il gesto principale è la spinta del corpo, non una posa dimostrativa delle teste.

Primo checkpoint proposto: verificare prima la **fiammata a distanza e l’accensione** con bocche, bersaglio e velocità relative; quindi **S-A contatto preparato** e **S-B massima spinta con appoggio**, con veicolo su livello separato per controllare scala, connessioni e contatto. Approvare i riferimenti prima della sequenza completa; aggiungere un breakdown se il trasferimento del peso o l’uscita dal ponte non sono leggibili. Nessuno spritesheet generato in questa fase di piano. Le GIF dei PNG restano distinte dalle prove effettive del gioco nel browser.

## Tracciabilità e versione

C-B 1.0.1 conserva l’approvazione ricevuta nella vecchia sequenza, senza diventare automaticamente una posa approvata per la spinta. C-C 1.1.0 è non approvata e accantonata; il retake C-C 1.1.1 non è stato generato. Conservare i file storici senza usarli come nuovi input canonici.

Questa revisione **3.0.0** aggiorna il contratto di identità al nuovo Cerbero proliferante approvato, incompatibile con la precedente anatomia a tre teste; conserva la sequenza fiammata, incendio, rallentamento, spinta e caduta del piano 2.0.0. Il pacchetto del riferimento ha versione distinta 1.0.5. Versione del protocollo, ID dei tentativi e timestamp mantengono namespace distinti.

**Registro:** 3.0.0 — 2026-10-31: riferimento proliferante originale e scala ridotta del 40% approvati dall’utente; sostituisce il vincolo di identità del piano 2.0.0, preservando la sua azione. Salvataggio del riferimento autorizzato al merge; nessuna integrazione runtime o animazione completa implicita.
