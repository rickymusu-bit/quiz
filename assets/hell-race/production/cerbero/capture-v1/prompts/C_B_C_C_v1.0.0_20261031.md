# Hellscape — C-B estensione e C-C morso, prompt operativo (Gate 1)

**Versione:** v1.0.0  
**Data:** 31 ottobre 2026 — Europe/Rome  
**Fonte:** piano `../PIANO_ASSET_CATTURA_v1.0.0_20261031.md`; protocollo sprite v15; sorgenti originali nel pacchetto `run-stabilized-v1`; V0 estratta dal browser nella PR #101.  
**Stato:** prompt candidati NON approvati; nessuna nuova posa convalidata. 

## Riferimenti da allegare fisicamente al generatore

1. `assets/hell-race/production/cerbero/run-stabilized-v1/frames/001.png` e `frames/008.png`, PNG RGBA originali (552×522): identità, palette rosso carnoso, tre teste/collo, articolazioni e stile da preservare. L'eventuale scelta definitiva di C-A richiede verifica di appoggio e raccordo.
2. `artifacts/capture-gate1/coupe_V0_intact.png` prodotto dal workflow `cerbero-capture-gate1.yml`: solo riferimento di scala, orientamento e punto di contatto; la coupé **non va disegnata dentro lo sprite di Cerbero**.
3. Una schermata reale del gioco sul medesimo commit (workflow `motion` della PR #100) per il contesto di camera e illuminazione, **non** come sorgente per generare sfondi.

Se i riferimenti PNG originali non sono effettivamente allegati all'input dell'operazione, non effettuare una generazione sostitutiva a partire dalla sola descrizione. Niente bozzetti illustrativi o tavole di progetto al posto del singolo sprite.

## Prompt C-B — una sola posa isolata, trasparente

> **Edit the ATTACHED original red/fleshy three-headed Hellscape Cerberus PNG, preserving that exact character.** Output **ONE SINGLE isolated full-body side-view RGBA sprite on a fully transparent background**, facing RIGHT, on the same 552×522 pixel canvas. **NOT** a storyboard, collage, sprite sheet, infographic, concept art, poster, game screenshot, or scene. **Do not draw any car, road, sky, particles, text, labels, panels or borders.** Retain the original crimson-red fleshy/armored anatomy, all three attached necks and heads, bony spikes, horns, tail, four intact articulated limbs, exact visual density, lighting and palette. Preserve identity, silhouette proportions and limb bone lengths. Change **only** the anatomy required for the next physically meaningful action: after a propulsive hind-leg extension, the torso still moves to the right, the *central* neck extends forward and slightly downward toward an invisible vehicle's REAR at image right; the *central* jaws open widely with anatomically credible jaw hinge. Side necks react with different small delays; preserve three distinct heads and their neck-to-body connections. Paws remain anatomically plausible, with a credible last propulsion or transition to forelimb support. No disconnected head, no floating claws, no rubbery warp, no body redesign. Single frame, transparent RGBA, no lettering whatsoever.

**Accettazione C-B:** esattamente un soggetto completo e isolato; tre colli; quattro zampe; la bocca centrale esposta verso destra; coerenza cromatica e morfologica con gli originali; alpha esterno trasparente; nessuna automobile o scenario.

## Prompt C-C — una sola posa isolata, trasparente

> **Use the ATTACHED, accepted Hellscape Cerberus C-B pose and the original red/fleshy Cerberus reference as STRICT identity anchors.** Output **ONE SINGLE full-body transparent RGBA PNG on the same 552×522 canvas**, facing RIGHT, no other objects and no background. **NOT** a storyboard, sprite sheet, infographic, game scene or text. The next event in physical time is a **bite by the CENTER head only** on the invisible **rear bumper of a vehicle located to Cerberus's RIGHT**. Central jaws close around the exact mouth contact point that was marked in approved C-B, neck remains connected and tense, torso carries forward momentum, forelimbs move toward braking contact, hindquarters lag inertially. Other two heads remain separately attached, responding with staggered delayed motion. Keep color, silhouette, proportions, four limbs, three heads, horns, tail and anatomy intact. Do not invent or paint the vehicle into this isolated sprite. No floating mouth, instant halt, impossible head rotation, detached parts, metal, flame, dust, labels or framed composition.

**Accettazione C-C:** morso conseguenza plausibile di C-B; punto di contatto anatomico annotabile e costante; nessuna carrozzeria nello sprite; mandibola centrale chiusa al perno, colli integri, colori invariati.

## X1 e postprocessing — dopo approvazione B/C

- Estrarre i PNG originali e annotare per B/C i punti **shoulder/torso, forepaw/hindpaw supports, neck base, central jaw hinge, central mouth contact**. Il punto di presa posteriore della coupé si annota su V0 e va verificato sulla grafica, non dedotto dal solo box della vettura.
- Comporre due layer separati (Cerbero a sinistra, V0 a destra); ancoraggi centrali nella stessa coordinata mondo, mantenendo le trasformazioni rigide. **X1 è un controllo tecnico, non uno sprite definitivo né una prova del runtime.**
- Allineare e controllare B/C con il tool esterno `rickymusu-bit/sprites-post` al commit vincolato in `.github/workflows/cerbero-postprocess.yml`. Conservare le immagini generate e i report: nessun warp di corpi, ossa o carrozzeria, no rimodellamento automatico di dettagli assenti.
- Per l'accettazione finale di Gate 1 acquisire dal browser **una GIF reale** dello stesso commit con C-A→C-B→C-C e coupé, oltre a screenshot e CI verde; nessun merge senza approvazione.

## Registro di esito generazioni esplorative del 31 ottobre

Tre tentativi esplorativi da ImageGen **sono stati scartati**: hanno restituito tavole illustrative su scenario con un Cerbero nero/grigio stilisticamente diverso dagli originali rossi, invece di un singolo PNG isolato trasparente. Non sono stati inseriti nel repository; non rappresentano pose C-B/C-C né anteprime del runtime. Per produrre pose nuove è obbligatorio associare effettivamente al generatore i PNG canonici; non ripetere il medesimo errore chiedendo genericamente una tavola di cattura.

**v1.0.0:** definizione dei singoli prompt, gate di conformità, tracciabilità dei tentativi respinti. Questo documento descrive prompt *da eseguire*, non finge che siano quelli eseguiti dai tentativi esplorativi.
