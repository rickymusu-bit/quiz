/* Shared scene coordinates and responsive UI. Does not read or mutate a match. */
(function (root) {
  'use strict';
  const reference = Object.freeze({width:1024, height:768, rasterWidth:768, rasterHeight:576});
  function measure(width, height) {
    const scale = Math.min(width / reference.width, height / reference.height);
    return {scale, compact:scale < 1,
      sceneWidth:reference.width * scale, sceneHeight:reference.height * scale};
  }
  const api = {reference, measure};
  if (typeof module !== 'undefined') module.exports = api;
  root.FoolLayout = api;
  if (!root.document) return;

  const doc = root.document, stage = doc.getElementById('viewport-stage');
  const css = doc.documentElement.style;
  css.setProperty('--stage-width', reference.width + 'px');
  css.setProperty('--stage-height', reference.height + 'px');
  css.setProperty('--stage-ratio', reference.width + '/' + reference.height);
  css.setProperty('--stage-aspect', String(reference.width / reference.height));
  if (!stage) return; // Standalone asset preview uses only the coordinate contract.
  let queued = false, wasCinematic = false, wasPlaying = false, wasFinished = false, previousPanel = null;
  let endingComplete = false;
  function fit() {
    queued = false;
    const viewport = root.visualViewport,
      width = viewport?.width || root.innerWidth,
      height = viewport?.height || root.innerHeight;
    let layout = measure(width, height);
    doc.body.dataset.layout = layout.compact ? 'compact' : 'stage';
    if (layout.compact) {
      const padding = getComputedStyle(stage), value = name => parseFloat(padding[name]) || 0;
      layout = measure(Math.max(1, width - value('paddingLeft') - value('paddingRight')),
        Math.max(1, height - value('paddingTop') - value('paddingBottom')));
    }
    css.setProperty('--scene-max-width', layout.sceneWidth + 'px');
    css.setProperty('--scene-max-height', layout.sceneHeight + 'px');
    stage.style.transform = layout.compact ? 'none' : 'translate(-50%,-50%) scale(' + layout.scale + ')';
    stage.dataset.fitScale = String(layout.compact ? 1 : layout.scale);
    if (doc.body.classList.contains('portrait')) doc.body.classList.remove('portrait');
    for (const dialog of doc.querySelectorAll('dialog[open]')) {
      dialog.style.maxHeight = Math.max(100, height - 24) + 'px';
      dialog.style.maxWidth = Math.max(100, width - 24) + 'px';
      dialog.style.overflow = 'auto';
    }
    const cinematic = doc.body.classList.contains('showing-cinematic'),
      playing = doc.body.classList.contains('playing'),
      finished = doc.body.classList.contains('finished'),
      panel = stage.querySelector('.operation-body'),
      panelMode = !panel ? null : panel.classList.contains('hidden-question') ? 'hidden' :
        panel.querySelector('.solution') ? 'result' : 'answer';
    if (layout.compact && cinematic && !wasCinematic) {
      stage.scrollTop = 0;
      const scene = stage.querySelector('.hell-race');
      if (scene) { scene.tabIndex = -1; scene.focus({preventScroll:true}); }
    } else if (layout.compact && !cinematic && (wasCinematic || (playing && !wasPlaying))) {
      const controls = stage.querySelector('.operation-body,.final-title');
      if (controls && getComputedStyle(controls).visibility !== 'hidden')
        controls.scrollIntoView({block:'nearest'});
    }
    if (layout.compact && !cinematic && panel && panelMode !== previousPanel && panelMode !== 'result') {
      const bounds = panel.getBoundingClientRect();
      if (bounds.bottom > height || bounds.top < 0)
        (stage.querySelector('.statusline') || panel).scrollIntoView({block:'start'});
    }
    if (layout.compact && finished && (!wasFinished || endingComplete) && !cinematic) {
      const title = stage.querySelector('.final-title');
      if (title && getComputedStyle(title).visibility !== 'hidden') title.scrollIntoView({block:'nearest'});
      else stage.scrollTop = 0;
    }
    wasCinematic = cinematic;
    wasPlaying = playing;
    wasFinished = finished;
    previousPanel = panelMode;
    endingComplete = false;
    return layout;
  }
  function schedule() {
    if (!queued) { queued = true; root.requestAnimationFrame(fit); }
  }
  api.fit = fit;
  root.fitFoolViewport = fit; // Existing public UI/test hook.
  new MutationObserver(schedule).observe(stage, {childList:true, subtree:true});
  new MutationObserver(schedule).observe(doc.body, {attributes:true, attributeFilter:['class']});
  root.addEventListener('resize', schedule);
  root.visualViewport?.addEventListener('resize', schedule);
  doc.addEventListener('fullscreenchange', schedule);
  doc.addEventListener('foolendingcomplete', () => { endingComplete = true; schedule(); });
  fit();
})(globalThis);
