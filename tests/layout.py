from pathlib import Path
from playwright.sync_api import sync_playwright
import threading,json
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)+'/'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'Fool.html')
    data=(ROOT/'Dataset_termologia_100_domande_v1_20261021.json').read_text()
    page.evaluate('raw=>{bank=F.parseDataset(raw,katex);const quotas={};bank.bank.forEach(q=>quotas[q.topic]=0);let left=33;while(left)for(const t in quotas)if(left&&quotas[t]<10){quotas[t]++;left--}prepared=F.prepare(bank.bank,{names:["Gruppo A","Gruppo B","Gruppo C"],seconds:45,probability:90,bases:{facile:100,media:200,difficile:300},difficulty:"misto",quotas},()=>0);game=F.Game.start(prepared,{random:()=>0});ui="game";renderGame()}',data)
    layouts=[]
    for width,height in [(240,320),(280,653),(320,568),(390,844),(768,1024),(844,390),(1024,768),(1280,800),(1440,900),(1920,1080)]:
        page.set_viewport_size({'width':width,'height':height})
        bad=page.evaluate('()=>bank.bank.filter(q=>!fitProbe(q)).map(q=>q.id)')
        assert not bad,(width,height,bad)
        layouts.append([width,height,100])
    page.set_viewport_size({'width':1280,'height':800})
    # Injection remains literal; no dataset HTML can execute.
    assert page.evaluate('()=>{const el=text("div","<img src=x onerror=alert(1)> \\(x^2\\)");return !el.querySelector("img")}')
    # Long content can flow vertically without being cut or blocking a small screen.
    assert page.evaluate('()=>fitProbe({...game.s.current,body:"Testo troppo lungo. ".repeat(600)})')
    page.evaluate('()=>{renderGame();game.reveal();renderGame()}');page.wait_for_timeout(100)
    page.set_viewport_size({'width':800,'height':600});page.wait_for_timeout(200)
    assert page.evaluate('!game.s.paused&&game.running&&!fitBlocked')
    page.set_viewport_size({'width':1440,'height':900});page.wait_for_timeout(100)
    # Inventory pagination aggregates unbounded counts, preserves locked targets.
    page.evaluate('()=>{for(let i=0;i<200;i++)game.s.groups[game.s.respondent].inventory.push({id:game.uid(),type:F.TYPES[i%5],target:null,origin:"test"});renderGame();showInventory()}')
    assert page.locator('.bonus-group').count()==5
    page.get_by_role('button',name='Chiudi',exact=True).click()
    # Invalid imported save must leave the game unchanged.
    assert page.evaluate('()=>{const current=game;try{restoreGame(JSON.stringify({...game.snapshot(),rules:"bad"}))}catch(e){}return game===current}')
    # Pause/answers work with network unavailable after initial load.
    page.context.set_offline(True)
    page.evaluate('()=>{game.s.panel=null;if(game.s.paused)game.resume();game.answer(game.s.current.correct);renderGame()}')
    assert page.evaluate('game.s.valid')==1
    page.screenshot(path=str(ROOT/'tests/formula-result.png'),full_page=True)
    page.context.set_offline(False)
    page.goto(base+'Fool_regole.html')
    slide_results=[]
    for width,height in [(240,320),(280,653),(320,568),(390,844),(768,1024),(844,390),(1024,768),(1280,800),(1440,900),(1920,1080)]:
        page.set_viewport_size({'width':width,'height':height})
        for i in range(21):
            page.locator('#section').select_option(str(i))
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(width,height,i)
        slide_results.append([width,height,21])
    print(json.dumps({'question_layouts':layouts,'slides':slide_results,'errors':errors},ensure_ascii=False))
    assert not errors
    browser.close()
