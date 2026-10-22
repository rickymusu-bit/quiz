/* Fit a landscape stage to the actual browser viewport without clipping content. */
(function(){
 'use strict';
 const stage=document.getElementById('viewport-stage');if(!stage)return;
 const note=document.createElement('div');note.id='orientation-note';note.setAttribute('role','status');const title=document.createElement('h2');title.textContent='Ruota lo schermo';const detail=document.createElement('p');detail.textContent='Fool si gioca in orizzontale.';note.append(title,detail);document.body.append(note);
 let queued=false,working=false;
 const bounds=()=>({w:document.documentElement.clientWidth,h:window.visualViewport?.height||innerHeight});
 function fitNode(root,w,h){
  const set=scale=>{root.style.zoom=String(scale);root.style.width=(w/scale)+'px'};
  const fits=scale=>{set(scale);const r=root.getBoundingClientRect();return Math.max(r.height,root.scrollHeight*scale)<=h+.1&&root.scrollWidth*scale<=w+.5};
  let scale=1;if(!fits(1)){let lo=.1,hi=1;for(let i=0;i<10;i++){const mid=(lo+hi)/2;if(fits(mid))lo=mid;else hi=mid}scale=Math.max(.1,lo-.001);set(scale)}
  root.dataset.fitScale=String(scale);return scale;
 }
 function fit(){
  queued=false;if(working)return;working=true;
  try{
   const {w,h}=bounds();const portrait=w<h;note.hidden=!portrait;document.body.classList.toggle('portrait',portrait);
   if(portrait){document.dispatchEvent(new Event('foolorientation'));return;}
   const main=stage.querySelector('main');if(main)main.style.minHeight='0px';
   const scale=fitNode(stage,w,Math.max(1,h-2));
   if(main){const header=stage.querySelector('header'),headHeight=header&&getComputedStyle(header).display!=='none'?header.offsetHeight:0;main.style.minHeight=Math.max(0,(h-2)/scale-headHeight)+'px'}
   for(const dialog of document.querySelectorAll('dialog[open]')){
    let content=dialog.querySelector(':scope > .dialog-stage');if(!content){content=document.createElement('div');content.className='dialog-stage';content.append(...dialog.childNodes);dialog.append(content)}
    dialog.style.maxHeight='none';dialog.style.maxWidth='none';dialog.style.overflow='visible';dialog.style.width=Math.min(900,w-24)+'px';
    const css=getComputedStyle(dialog),padX=parseFloat(css.paddingLeft)+parseFloat(css.paddingRight)+6,padY=parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)+6;
    fitNode(content,Math.max(1,dialog.getBoundingClientRect().width-padX),Math.max(1,h-24-padY));
   }
   window.scrollTo(0,0);
  }finally{working=false}
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(fit)}}
 window.fitFoolViewport=fit;
 new MutationObserver(records=>{if(records.some(r=>{const el=r.target.nodeType===1?r.target:r.target.parentElement;return el&&(stage.contains(el)||el.closest('dialog')||(el===document.body&&r.type==='attributes'))&&!el.closest('#timer')}))schedule()}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','hidden','open']});
 window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);document.addEventListener('fullscreenchange',schedule);window.addEventListener('load',schedule);document.addEventListener('load',schedule,true);document.fonts?.addEventListener('loadingdone',schedule);document.fonts?.ready.then(schedule);schedule();
})();
