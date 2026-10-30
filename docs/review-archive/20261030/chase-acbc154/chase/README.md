# Hellscape — PR C: inseguimento e catture

Revisione dei sorgenti e dell'HTML: `acbc154bbea80f16874d4976b9fd1db8bb9df2f4`.

Screenshot acquisiti dal vero HTML autonomo senza rete su desktop e Android verticale. Il report locale di consegna riproduce il finale con due perdenti e raccoglie otto campioni di quattro fasi su due viewport; descrive questi soli campioni.

La suite completa `npm run test:chase` verifica zero/uno/due perdenti e 40 campioni su cinque viewport a DPR 1/2. La pipeline comprende inoltre motore, dataset, atlanti, spareggio, locomozione, layout, interfaccia, Ammo, finali, terreno, build, offline e audit visivo. [Risultati CI della revisione](https://github.com/rickymusu-bit/quiz/actions/runs/40664575691).

L'HTML autonomo è generato nel relativo artifact CI come `Hellscape-review.html`. Il pannello **Scenari di revisione** include i filmati con zero/uno/due perdenti e i fotogrammi fila, presa e bocca. Motore e salvataggi conservano il loro comportamento. Portale monumentale, ponte ed epilogo appartengono alla PR D.
