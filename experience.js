/* LUNA EN VILLA PELÓN — EXPERIENCIA V1.1 */
(function(){
  const ONBOARD='lunaOnboardingV1';
  const $=id=>document.getElementById(id);
  const hasSave=()=>{try{return !!localStorage.getItem('lunaVillaPelon')}catch(e){return false}};

  function addGuide(){
    if($('guide')) return;
    const s=document.createElement('section');
    s.id='guide'; s.className='screen overlay experience-screen';
    s.innerHTML=`<div class="box guide-box">
      <p class="eyebrow">ANTES DE EMPEZAR</p>
      <h2>Solo tenés que hacer tres cosas</h2>
      <div class="guide-grid">
        <div><b>1. Caminá</b><span>Usá las flechas o WASD. En celular, usá los controles de pantalla.</span></div>
        <div><b>2. Mirá y hablá</b><span>Acercate a una persona. Cuando aparezca “Hablar”, interactuá.</span></div>
        <div><b>3. Seguí la misión</b><span>El objetivo de arriba te dice qué hacer. No necesitás memorizar nada.</span></div>
      </div>
      <div class="first-objective"><strong>Tu primer objetivo</strong><span>Encontrá a Don Mateo y escuchá qué necesita.</span></div>
      <button id="guideStart" class="primary">Entrar y jugar</button>
    </div>`;
    $('app').appendChild(s);
    $('guideStart').onclick=()=>{try{localStorage.setItem(ONBOARD,'1')}catch(e){};s.classList.remove('active');window.__baseEnter();};
  }

  addGuide();
  const start=$('startBtn');
  if(start) start.textContent=hasSave()?'Continuar aventura':'Comenzar aventura';

  // app.js asigna enterBtn.onclick antes de cargar este archivo. Guardamos la
  // función original y reemplazamos también el handler del botón para que el
  // onboarding no dependa de cómo el navegador expone funciones globales.
  window.__baseEnter=window.enter;
  window.enter=function(){
    let first=false;
    try{first=!localStorage.getItem(ONBOARD) && !hasSave();}catch(e){first=!hasSave()}
    if(first){$('guide').classList.add('active');return;}
    window.__baseEnter();
  };
  const enterBtn=$('enterBtn');
  if(enterBtn) enterBtn.onclick=window.enter;

  const intro=$('intro');
  if(intro && hasSave()){
    const h=intro.querySelector('h2'), p=intro.querySelector('p:not(.eyebrow)');
    if(h) h.textContent='Tu aventura está guardada.';
    if(p) p.textContent='Podés volver a Villa Pelón exactamente donde la dejaste. Tu misión, tus pistas y tus recuerdos se conservan automáticamente.';
    if(enterBtn) enterBtn.textContent='Continuar partida';
  }

  const world=$('world');
  if(world){
    const tracker=document.createElement('div');
    tracker.id='questTracker';
    tracker.innerHTML='<span class="qt-label">MISIÓN</span><strong id="qtTitle">Conocé a Don Mateo</strong><span id="qtHint">Acercate a la persona marcada.</span>';
    world.appendChild(tracker);
    const update=()=>{
      if(typeof state==='undefined') return;
      const title=$('qtTitle'),hint=$('qtHint');
      if(state.reward){title.textContent='Misión completada ✓';hint.textContent='Desbloqueaste tu primer recuerdo.'}
      else if(!state.mission){title.textContent='Conocé a Don Mateo';hint.textContent='Buscá a la persona marcada y acercate para hablar.'}
      else if(!state.rosa || !state.tomas){title.textContent=`Encontrá las dos pistas (${Number(!!state.rosa)+Number(!!state.tomas)}/2)`;hint.textContent='Visitá a Rosa y a Tomás. Podés hacerlo en cualquier orden.'}
      else {title.textContent='Volvé con Don Mateo';hint.textContent='Ya reuniste las dos pistas. Regresá con Don Mateo.'}
    };
    const oldUpdate=window.updateMission;
    if(typeof oldUpdate==='function') window.updateMission=function(){oldUpdate();update()};
    update();

    const oldDraw=window.draw;
    if(typeof oldDraw==='function') window.draw=function(){
      oldDraw();
      if(typeof state==='undefined'||typeof camera==='undefined'||typeof viewport==='undefined'||typeof ctx==='undefined') return;
      let target=null;
      if(state.reward) return;
      if(!state.mission) target=npcs.find(n=>n.id==='mateo');
      else if(!state.rosa) target=npcs.find(n=>n.id==='rosa');
      else if(!state.tomas) target=npcs.find(n=>n.id==='tomas');
      else target=npcs.find(n=>n.id==='mateo');
      if(!target) return;
      const sx=target.x-camera.x, sy=target.y-camera.y;
      const pulse=8+Math.sin(performance.now()/180)*3;
      ctx.save();
      if(sx>=-40&&sx<=viewport.w+40&&sy>=-60&&sy<=viewport.h+60){
        ctx.strokeStyle='#f4d58d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy-48,18+pulse/3,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='#f4d58d';ctx.beginPath();ctx.moveTo(sx,sy-24);ctx.lineTo(sx-9,sy-39);ctx.lineTo(sx+9,sy-39);ctx.closePath();ctx.fill();
      }
      ctx.restore();
    };
  }

  const originalInteract=window.interact;
  if(typeof originalInteract==='function') window.interact=function(){originalInteract();setTimeout(()=>{if(window.updateMission)window.updateMission()},0)};
})();
