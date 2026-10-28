# Locomozione e spazio di scena — PR A

Prima fase del piano cinematografico 1.2.0, dopo audit visivo e layout.

`assets/hell-motion.js` gestisce soltanto la presentazione. Il tempo attivo
avanza con il delta di `requestAnimationFrame`; distanza e velocità derivano
dall'integrale dell'accelerazione esponenziale. Il ponte usa 48 pixel logici al
secondo nella corsa ordinaria. Un ciclo delle quattro pose copre 64 pixel;
le pose si interpolano e gli impatti avvengono ogni mezzo ciclo. La polvere
riceve gli stessi istanti di contatto, anche quando la velocità cambia.

Le catture rallentano gradualmente il fondale al 40%, l'uscita lo accelera al
125% e la reazione ferma progressivamente la strada. Queste velocità non
cambiano durata, ordine o risultato delle azioni del motore. Lava ed effetti
ambientali usano lo stesso tempo attivo senza sommare un secondo timer finale.

Il clock resta associato alla partita attraverso i render della UI; pause,
schede nascoste e delta oltre 250 ms non producono recuperi o salti. La modalità
movimento ridotto mantiene una posa statica e conserva il percorso accessibile
di Ammo e finali. Il clock non viene scritto nei salvataggi. Anche l'avanzamento
visivo del punteggio riparte dalla posizione visualizzata quando cambia il
bersaglio durante un'interpolazione.

Il demone mantiene scala 1,3 e un margine a sinistra di 8 pixel logici. Il punto
iniziale dei mezzi passa da 222 a 254; distanza massima, proporzioni e curva
logaritmica dei punteggi restano identiche. Testa, corna, coda e zampe restano
nel palco 512 × 384. L'estrazione delle pose conserva lo spostamento verticale
originale nella riga, con padding su tutti i lati. Nessun asset è stato ridotto
o rigenerato. Un Canvas di composizione viene riutilizzato per interpolare le
pose senza rendere trasparente la parte comune del corpo.

## Verifiche riproducibili

- `npm run test:motion`: confronta distanza, velocità, fase e impatti a
  30/60/144 FPS; controlla offline desktop e Android nelle due orientazioni,
  DPR 1/2, pausa, visibilità, continuità dei render, movimento ridotto e
  invarianza del motore. Produce screenshot, sequenza di pose e GIF in
  `artifacts/motion/`, oltre all'HTML autonomo `dist/Hellscape-review.html`.
- `npm run test:frames`: tutte le sagome complete e con margini, proporzioni
  dei mezzi, particelle deterministiche e senza uso del generatore del gioco.
- Le suite esistenti verificano motore, persistenza, Ammo, eliminazioni,
  finali, layout, terreno e risorse offline. La CI include la nuova suite.

La nuova introduzione allo spareggio resta nella PR B. Fila indiana, raccordi
tra gli atlanti di corsa e cattura, nuove prese e inseguimento del vincitore
restano nella PR C. Il portale monumentale e il nuovo epilogo restano nella PR D.
Il fondale ora si muove nel finale esistente; la sua coreografia non è ancora
quella nuova prevista dalla specifica.
