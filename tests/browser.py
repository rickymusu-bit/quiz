from pathlib import Path
from playwright.sync_api import sync_playwright
import json, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parent.parent)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base="http://127.0.0.1:"+str(server.server_port)+"/"
ROOT=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append(r.url) if r.url.startswith('http') and not r.url.startswith(base) else None)
    page.goto(base+'Fool.html')
    page.wait_for_function('bank && document.getElementById("quotas")')
    assert page.locator('input[type=file],a[download]').count()==0
    page.get_by_role('button',name='Prepara anteprima').click()
    page.get_by_role('button',name='Verifica schermo e inizia Fool').click();page.wait_for_timeout(150)
    print('MESSAGE',page.locator('#message').inner_text());print('STATE',page.evaluate('({screen:game?.s.screen,ui,fitBlocked})'))
    page.screenshot(path=str(ROOT/'tests/game.png'),full_page=True)
    if page.get_by_role('button',name='Svela e avvia il tempo').count():
        page.get_by_role('button',name='Svela e avvia il tempo').click();page.wait_for_timeout(150)
        print('REVEAL',page.evaluate('({screen:game.s.screen,running:game.running,fitBlocked})'))
        page.screenshot(path=str(ROOT/'tests/question.png'),full_page=True)
        page.get_by_role('button',name='Pausa',exact=True).click()
        before=page.evaluate('game.left()');page.wait_for_timeout(300);assert before==page.evaluate('game.left()')
        page.get_by_role('button',name='Sanzioni',exact=True).click();page.locator('#sanction-0').fill('1');page.get_by_role('button',name='Conferma intervento').click();assert page.evaluate('game.s.groups[0].sanctions')==1;assert not page.evaluate('game.running')
        page.get_by_role('button',name='Riprendi timer').click()
        page.locator('.answer').nth(page.evaluate('game.s.current.correct')).click();page.wait_for_timeout(100)
        page.screenshot(path=str(ROOT/'tests/result.png'),full_page=True)
        print('RESULT',page.evaluate('({screen:game.s.screen,valid:game.s.valid,fitBlocked})'))
    page.reload();page.get_by_role('button',name='Riprendi partita',exact=True).click();assert page.evaluate('game.s.valid')==1;assert not page.evaluate('game.running');assert page.locator('input[type=file],a[download]').count()==0
    page.goto(base+'Fool_regole.html');
    overflows=[]
    for i in range(21):
        page.locator('#section').select_option(str(i))
        if page.evaluate('document.documentElement.scrollHeight>innerHeight+1'):overflows.append(i+1)
    page.get_by_role('button',name='Indice',exact=True).click();page.get_by_role('button',name='1. Benvenuti in Fool',exact=True).click();assert page.locator('#section').input_value()=='0'
    page.locator('.slide.active').focus();page.keyboard.press('ArrowRight');assert page.locator('#section').input_value()=='1'
    page.screenshot(path=str(ROOT/'tests/rules.png'),full_page=True)
    print('SLIDES_OVERFLOW',overflows);print('ERRORS',errors);print('NETWORK',requests)
    assert not errors and not requests and not overflows
    browser.close()
