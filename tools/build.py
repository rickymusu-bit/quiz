"""Rigenera due HTML autonomi, senza rete né dipendenze aggiuntive."""
from pathlib import Path
import json,html
ROOT=Path(__file__).resolve().parent.parent
read=lambda p:(ROOT/p).read_text()
esc=html.escape
css=read('src/style.css')
def page(title,body,script,math=False):
    katex=('<!-- '+read('vendor/LICENSE-KaTeX.txt')+' --><style>'+read('vendor/katex.css')+'</style><script>'+read('vendor/katex.js')+'</script>') if math else ''
    return '<!doctype html>\n<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>'+title+'</title><style>'+css+'</style>'+katex+'</head><body><header><span class="brand">FOOL</span><small>App 1.0.0 · Regolamento 18.0.1 · 21/10/2026</small></header>'+body+'<script>'+script+'</script></body></html>\n'
body='<main id="main"></main><div id="message" role="status" aria-live="polite"></div><dialog id="dialog" aria-label="Decisione docente"></dialog><aside id="fit-warning" class="fit-warning" role="alert" hidden></aside>'
(ROOT/'Fool.html').write_text(page('Fool',body,read('src/engine.js')+'\n'+read('src/app.js'),True))
slides=json.loads(read('src/slides.json'))
sections=[]
for i,s in enumerate(slides):
    sections.append('<!-- REG-'+', REG-'.join(s['regs'])+' --><section class="slide" tabindex="-1" aria-labelledby="title-'+str(i)+'"><p class="eyebrow">Fool · Le regole</p><h2 id="title-'+str(i)+'">'+esc(s['title'])+'</h2><ul>'+''.join('<li>'+esc(p)+'</li>' for p in s['body'])+'</ul><div class="example">'+esc(s['example'])+'</div></section>')
options=''.join('<option value="'+str(i)+'">'+str(i+1)+'. '+esc(s['title'])+'</option>' for i,s in enumerate(slides))
index=''.join('<button data-go="'+str(i)+'">'+str(i+1)+'. '+esc(s['title'])+'</button>' for i,s in enumerate(slides))
body='<main id="slides">'+''.join(sections)+'<nav class="slides-nav" aria-label="Navigazione regole"><button id="previous">← Precedente</button><select id="section" aria-label="Sezione">'+options+'</select><span id="counter"></span><button id="index-button">Indice</button><button id="next">Successiva →</button></nav><p class="slide-meta">Regolamento 18.0.1 · 21/10/2026 · Frecce ← → per cambiare sezione</p></main><dialog id="index"><h2>Indice delle regole</h2><div class="index-grid">'+index+'</div><button id="close-index">Chiudi indice</button></dialog>'
(ROOT/'Fool_regole.html').write_text(page('Fool — Regole per la classe',body,read('src/slides.js')))
print('Generati Fool.html e Fool_regole.html')
