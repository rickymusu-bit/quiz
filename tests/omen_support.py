"""Omen rules through real controls; one-viewport HUD, rotation and offline saves."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright, expect
import threading, os, json
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'artifacts/omen';ART.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
def fixture(v):
 return v.evaluate('''()=>{const g=HellscapeUI.game,s=g.s;for(let i=0;i<3;i++){s.groups[i].score=Fool.rational(1000);s.groups[i].inventory=Fool.TYPES.map(type=>({id:g.uid(),type,target:null,origin:'browser'}));}s.config.bonusWeights=Object.fromEntries(Fool.TYPES.map(t=>[t,0]));HellscapeUI.changed();return {source:s.owner,target:s.order[1],third:s.order[2]};}''')
def layout(v,w,h):
 data=v.evaluate('''()=>{const stage=document.querySelector('#viewport-stage');const nodes=[...document.querySelectorAll('.turn-order [data-team],.operation-body,.operation-body .answer,.operation-body [data-game-action],.options-toggle,.statusline')];return {scroll:[stage.scrollWidth-stage.clientWidth,stage.scrollHeight-stage.clientHeight],outside:nodes.filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)}).map(e=>[e.className,e.getBoundingClientRect().toJSON()])};}''')
 assert data['scroll'][0]<=1 and data['scroll'][1]<=1,data
 assert not data['outside'],(w,h,data)
 assert v.locator('.turn-order').bounding_box()['y']<h*.12
 assert v.locator('#fit-warning').is_hidden()
 box=v.locator('.operation-body').bounding_box()
 timer=v.locator('.statusline').bounding_box()
 options=v.locator('.options-toggle').bounding_box()
 stage=v.locator('#viewport-stage').bounding_box()
 assert timer['width']>box['width']*.6
 assert box['y']<=timer['y'] and timer['y']+timer['height']<=box['y']+box['height']
 question=v.locator('.question')
 if question.count() and question.is_visible():
  assert timer['y']+timer['height']<=question.bounding_box()['y']+1
 assert options['y']-stage['y']<35 and options['x']-stage['x']<35
 assert options['x']+options['width']<stage['x']+stage['width']/2
 players=v.locator('.turn-order').bounding_box()
 assert 0<=stage['x']+stage['width']-players['x']-players['width']<35
 assert players['x']>stage['x']+stage['width']/2
def select(v,type,target=None):
 v.get_by_role('button',name='Inventario',exact=True).click()
 icon=v.locator(f'#dialog [data-ammo="{type}"]')
 if not icon.count():
  v.get_by_role('button',name='Successivi',exact=True).click();icon=v.locator(f'#dialog [data-ammo="{type}"]')
 icon.first.click();v.locator('#ammo-info').get_by_role('button',name='Usa',exact=True).click()
 if target is not None:v.locator('#bonus-target').select_option(str(target))
def confirm(v):v.locator('#dialog').get_by_role('button',name='Conferma uso',exact=True).click()
